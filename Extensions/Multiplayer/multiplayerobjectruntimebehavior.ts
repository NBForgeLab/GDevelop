/*
  GDevelop - Multiplayer Object Behavior Extension
  Copyright (c) 2013-2016 Florian Rival (Florian.Rival@gmail.com)
*/

namespace gdjs {
  const logger = new gdjs.Logger('Multiplayer');
  const debugLogger = new gdjs.Logger('Multiplayer - Debug');
  const getTimeNow =
    window.performance && typeof window.performance.now === 'function'
      ? window.performance.now.bind(window.performance)
      : Date.now;

  /**
   * The MultiplayerObjectRuntimeBehavior represents a behavior that can be added to objects
   * to make them synchronized over the network.
   * @category Behaviors > Multiplayer
   */
  export class MultiplayerObjectRuntimeBehavior extends gdjs.RuntimeBehavior {
    // Which player is the owner of the object.
    // If 0, then the object is not owned by any player, so the host is the owner.
    playerNumber: number = 0;

    // The action to be executed when the player disconnects.
    actionOnPlayerDisconnect: string;

    // The last time the object has been synchronized.
    // This is to avoid synchronizing the object too often, see _objectMaxSyncRate.
    _lastObjectSyncTimestamp: number = 0;

    // The last time the basic object info has been synchronized.
    _lastBasicObjectSyncTimestamp: number = 0;
    // The number of times per second the object basic info should be synchronized when it doesn't change.
    _objectBasicInfoSyncRate: number = 5;
    // The last data sent to synchronize the basic info of the object.
    _lastSentBasicObjectSyncData: BasicObjectNetworkSyncData | undefined;
    // When we know that the basic info of the object has been updated, we can force sending them
    // on the max SyncRate for a number of times to ensure they are received, without the need of an acknowledgment.
    _numberOfForcedBasicObjectUpdates: number = 0;

    // The last time the variables have been synchronized.
    _lastVariablesSyncTimestamp: number = 0;
    // The number of times per second the variables should be synchronized.
    _variablesSyncRate: number = 1;
    // The last data sent to synchronize the variables.
    _lastSentVariableSyncData: VariableNetworkSyncData[] | undefined;
    // When we know that the variables have been updated, we can force sending them
    // on the same syncRate as the object update for a number of times
    // to ensure they are received, without the need of an acknowledgment.
    _numberOfForcedVariablesUpdates: number = 0;

    // The last time the effects have been synchronized.
    _lastEffectsSyncTimestamp: number = 0;
    // The number of times per second the effects should be synchronized.
    _effectsSyncRate: number = 1;
    // The last data sent to synchronize the effects.
    _lastSentEffectSyncData:
      | { [effectName: string]: EffectNetworkSyncData }
      | undefined;
    // When we know that the effects have been updated, we can force sending them
    // on the same syncRate as the object update for a number of times
    // to ensure they are received, without the need of an acknowledgment.
    _numberOfForcedEffectsUpdates: number = 0;

    // To avoid seeing too many logs.
    _lastLogTimestamp: number = 0;
    _logSyncRate: number = 1;
    // Clock to be incremented every time we send a message, to ensure they are ordered
    // and old messages are ignored.
    _clock: number = 0;
    _destroyInstanceTimeoutId: NodeJS.Timeout | null = null;
    _timeBeforeDestroyingObjectWithoutNetworkIdInMs = 500;

    // A temporary controller can be allowed to update the object without
    // changing its persistent owner. This is meant for short interactions like
    // dragging, looting or using a shared object.
    _controllerPlayerNumber: number | null = null;
    _controlLeaseId: string = '';
    _controlLeaseExpiresAt: number = 0;
    _controlRequestPending: boolean = false;
    _controlRequestId: string = '';
    _controlRequestSentAt: number = 0;
    _controlRequestTimeoutInMs: number = 1000;
    _justGotControl: boolean = false;
    _controlRequestRefused: boolean = false;
    _controlReleasePending: boolean = false;
    _lastControlKeepSentAt: number = 0;
    _controlKeepMinIntervalInMs: number = 100;
    // Track the last controller and lease id sent to peers to force immediate sync on change.
    _lastSentControllerPlayerNumber: number | null = null;
    _lastSentControlLeaseId: string = '';

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      behaviorData,
      owner: RuntimeObject
    ) {
      super(instanceContainer, behaviorData, owner);
      this.playerNumber =
        behaviorData.playerNumber === 'Host'
          ? 0
          : parseInt(behaviorData.playerNumber, 10);
      this.actionOnPlayerDisconnect = behaviorData.actionOnPlayerDisconnect;

      // When a synchronized object is created, we assume it will be assigned a networkId quickly if:
      // - It is a new object created by the current player. -> will be assigned a networkId when sending the update message.
      // - It is an object created by another player. -> will be assigned a networkId when receiving the update message.
      // There is a small risk that the object is created by us after we receive an update message from the host,
      // ending up with 2 objects created, one with a networkId (from the host) and one without (from us).
      // To handle this case and avoid having an object not synchronized, we set a timeout to destroy the object
      // if it has not been assigned a networkId after a short delay.
      this._destroyInstanceTimeoutId = setTimeout(() => {
        const sceneNetworkId = this.owner.getRuntimeScene().networkId;
        if (
          !owner.networkId &&
          gdjs.multiplayer.isLobbyGameRunning() &&
          sceneNetworkId
        ) {
          debugLogger.info(
            `Lobby game is running on a synced scene and object ${owner.getName()} has not been assigned a networkId after a short delay, destroying it.`
          );
          owner.deleteFromScene();
        }
      }, this._timeBeforeDestroyingObjectWithoutNetworkIdInMs);
    }

    private _sendDataToPeersWithIncreasedClock = async (
      messageName: string,
      data: Object
    ) => {
      this._clock++;
      data['_clock'] = this._clock;
      const connectedPeerIds = gdjs.multiplayerPeerJsHelper.getAllPeers();
      await gdjs.multiplayerMessageManager.sendDataTo(
        connectedPeerIds,
        messageName,
        data
      );
    };

    private _isOwnerAsPlayerOrHost() {
      const currentPlayerNumber = gdjs.multiplayer.getCurrentPlayerNumber();
      const isHost = gdjs.multiplayer.isCurrentPlayerHost();

      const isOwnerOfObject =
        currentPlayerNumber === this.playerNumber || // Player as owner.
        (isHost && this.playerNumber === 0); // Host as owner.

      return isOwnerOfObject;
    }

    private _isCurrentPlayerNumberOrHostForPlayer(playerNumber: number) {
      const currentPlayerNumber = gdjs.multiplayer.getCurrentPlayerNumber();
      return (
        currentPlayerNumber === playerNumber ||
        (gdjs.multiplayer.isCurrentPlayerHost() && playerNumber === 0)
      );
    }

    private _getEffectiveControllerPlayerNumber() {
      this._clearExpiredControlLease();
      return this._controllerPlayerNumber !== null
        ? this._controllerPlayerNumber
        : this.playerNumber;
    }

    private _isControlLeaseActive() {
      this._clearExpiredControlLease();
      return (
        this._controllerPlayerNumber !== null &&
        !!this._controlLeaseId
      );
    }

    private _clearExpiredControlLease() {
      if (this._controllerPlayerNumber === null) {
        return;
      }
      const now = getTimeNow();
      let expirationTime = this._controlLeaseExpiresAt;
      if (
        gdjs.multiplayer.isCurrentPlayerHost() &&
        this._controllerPlayerNumber !== 0 &&
        this._controllerPlayerNumber !== gdjs.multiplayer.getCurrentPlayerNumber()
      ) {
        // Add a 300ms grace period for remote players on the host to tolerate latency.
        expirationTime += 300;
      }
      if (now >= expirationTime) {
        this._clearObjectControlLease();
      }
    }

    private _canCurrentPlayerSynchronizeObject() {
      return this._isCurrentPlayerNumberOrHostForPlayer(
        this._getEffectiveControllerPlayerNumber()
      );
    }

    private _hasControlRequestTimedOut() {
      return (
        this._controlRequestPending &&
        getTimeNow() - this._controlRequestSentAt >=
          this._controlRequestTimeoutInMs
      );
    }

    private _getValidControlDurationInMs(durationInSeconds: number) {
      let durationInMs = durationInSeconds * 1000;
      if (!Number.isFinite(durationInMs) || durationInMs <= 0) {
        logger.error(
          'Cannot request or keep control of an object for a non-positive or invalid duration.'
        );
        return null;
      }
      if (durationInMs > 10000) {
        durationInMs = 10000;
      }
      return durationInMs;
    }

    private _clearOneFrameControlFlags() {
      this._justGotControl = false;
      this._controlRequestRefused = false;
    }

    private _sendPendingObjectControlRelease() {
      if (!this._controlReleasePending) {
        return;
      }

      const sceneNetworkId = this.owner.getRuntimeScene().networkId;
      const instanceNetworkId = this.owner.networkId;
      const controllerPlayerNumber = this._getEffectiveControllerPlayerNumber();
      const leaseId = this._controlLeaseId;

      this._controlReleasePending = false;
      this._clearObjectControlLease();

      if (!sceneNetworkId || !instanceNetworkId) return;

      gdjs.multiplayerMessageManager.sendReleaseObjectControlMessage({
        objectName: this.owner.getName(),
        instanceNetworkId,
        sceneNetworkId,
        controllerPlayerNumber,
        leaseId,
      });
    }

    private _hasObjectBeenSyncedWithinMaxRate() {
      const objectMaxSyncRate =
        gdjs.multiplayer.getObjectsSynchronizationRate();
      return (
        getTimeNow() - this._lastObjectSyncTimestamp < 1000 / objectMaxSyncRate
      );
    }

    private _hasObjectBasicInfoBeenSyncedRecently() {
      return (
        getTimeNow() - this._lastBasicObjectSyncTimestamp <
        1000 / this._objectBasicInfoSyncRate
      );
    }

    private _haveVariablesBeenSyncedRecently() {
      return (
        getTimeNow() - this._lastVariablesSyncTimestamp <
        1000 / this._variablesSyncRate
      );
    }

    private _haveEffectsBeenSyncedRecently() {
      return (
        getTimeNow() - this._lastEffectsSyncTimestamp <
        1000 / this._effectsSyncRate
      );
    }

    // private _logToConsoleWithThrottle(message: string) {
    //   if (getTimeNow() - this._lastLogTimestamp > 1000 / this._logSyncRate) {
    //     logger.info(message);
    //     this._lastLogTimestamp = getTimeNow();
    //   }
    // }

    private _getOrCreateInstanceNetworkId() {
      if (!this.owner.networkId) {
        // No ID for this object, let's generate one so it can be identified by other players.
        // Keep it short to avoid sending too much data.
        const newID = gdjs.makeUuid().substring(0, 8);
        this.owner.networkId = newID;
      }

      return this.owner.networkId;
    }

    private _isBasicObjectNetworkSyncDataDifferentFromLastSync(
      basicObjectNetworkSyncData: BasicObjectNetworkSyncData
    ) {
      if (!this._lastSentBasicObjectSyncData) {
        return true;
      }

      // Compare the json of the basicObjectNetworkSyncData to check if they are different.
      // This is not the most efficient way to do it, but it's simple and should work.
      const haveBasicObjectNetworkSyncDataChanged =
        JSON.stringify(basicObjectNetworkSyncData) !==
        JSON.stringify(this._lastSentBasicObjectSyncData);

      return haveBasicObjectNetworkSyncDataChanged;
    }

    private _areVariablesDifferentFromLastSync(
      variablesSyncData: VariableNetworkSyncData[]
    ) {
      if (!this._lastSentVariableSyncData) {
        return true;
      }

      // Compare the json of the variables to check if they are different.
      // This is not the most efficient way to do it, but it's simple and should work.
      const haveVariableSyncDataChanged =
        JSON.stringify(variablesSyncData) !==
        JSON.stringify(this._lastSentVariableSyncData);

      return haveVariableSyncDataChanged;
    }

    private _areEffectsDifferentFromLastSync(effectsSyncData: {
      [effectName: string]: EffectNetworkSyncData;
    }) {
      if (!this._lastSentEffectSyncData) {
        return true;
      }

      for (const effectName in effectsSyncData) {
        if (!effectsSyncData.hasOwnProperty(effectName)) {
          continue;
        }

        const effectSyncData = effectsSyncData[effectName];
        const effectEnabled = effectSyncData.ena;
        const effectFilterCreator = effectSyncData.fc;

        const effectInLastSync = this._lastSentEffectSyncData[effectName];

        if (!effectInLastSync || effectInLastSync.ena !== effectEnabled) {
          return true;
        }

        for (const parameterName in effectFilterCreator) {
          if (!effectFilterCreator.hasOwnProperty(parameterName)) {
            continue;
          }

          const parameterValue = effectFilterCreator[parameterName];
          const lastParameterValueSent = effectInLastSync.fc[parameterName];
          if (lastParameterValueSent !== parameterValue) {
            return true;
          }
        }
      }

      return false;
    }

    doStepPostEvents() {
      if (!gdjs.multiplayer.isLobbyGameRunning()) {
        return;
      }
      try {
        // If game is running and the object belongs to a player who is not connected, destroy the object.
        // As the game may create objects before the lobby game starts, we don't want to destroy them if it's not running.
        if (
          this.actionOnPlayerDisconnect !== 'DoNothing' && // Should not delete if flagged as such.
          this.playerNumber !== 0 && // Host is always connected.
          !gdjs.multiplayerMessageManager.isPlayerConnected(this.playerNumber)
        ) {
          debugLogger.info(
            `Player number ${this.playerNumber} does not exist in the lobby at the moment. Destroying the object.`
          );
          this.owner.deleteFromScene();
          return;
        }

        if (!this._canCurrentPlayerSynchronizeObject()) {
          return;
        }

        const currentController = this._getEffectiveControllerPlayerNumber();
        const currentLeaseId = this._controlLeaseId;
        if (
          currentController !== this._lastSentControllerPlayerNumber ||
          currentLeaseId !== this._lastSentControlLeaseId
        ) {
          this._numberOfForcedBasicObjectUpdates = Math.max(
            this._numberOfForcedBasicObjectUpdates,
            3
          );
        }

        // If the object has been synchronized recently at the max rate, then return.
        // This is to avoid sending data on every frame, which would be too much.
        if (
          !this._controlReleasePending &&
          this._hasObjectBeenSyncedWithinMaxRate()
        ) {
          return;
        }

        const instanceNetworkId = this._getOrCreateInstanceNetworkId();
        const objectName = this.owner.getName();
        const objectNetworkSyncData = this.owner.getNetworkSyncData({});
        (objectNetworkSyncData as any)._controller =
          this._getEffectiveControllerPlayerNumber();
        if (this._controlLeaseId) {
          (objectNetworkSyncData as any)._controlLeaseId = this._controlLeaseId;
        }

        // this._logToConsoleWithThrottle(
        //   `Synchronizing object ${this.owner.getName()} (instance ${
        //     this.owner.networkId
        //   }) with player ${this.playerNumber} and data ${JSON.stringify(
        //     objectNetworkSyncData
        //   )}`
        // );

        const areBasicObjectNetworkSyncDataDifferent =
          this._isBasicObjectNetworkSyncDataDifferentFromLastSync({
            x: objectNetworkSyncData.x,
            y: objectNetworkSyncData.y,
            z: objectNetworkSyncData.z,
            w: objectNetworkSyncData.w,
            h: objectNetworkSyncData.h,
            zo: objectNetworkSyncData.zo,
            a: objectNetworkSyncData.a,
            hid: objectNetworkSyncData.hid,
            lay: objectNetworkSyncData.lay,
            if: objectNetworkSyncData.if,
            pfx: objectNetworkSyncData.pfx,
            pfy: objectNetworkSyncData.pfy,
          });
        const shouldSyncObjectBasicInfo =
          !this._hasObjectBasicInfoBeenSyncedRecently() ||
          areBasicObjectNetworkSyncDataDifferent ||
          this._numberOfForcedBasicObjectUpdates > 0;
        if (areBasicObjectNetworkSyncDataDifferent) {
          this._numberOfForcedBasicObjectUpdates = 3;
        }
        if (!shouldSyncObjectBasicInfo) {
          // If the basic info has not changed, assume we don't need to sync the whole object data at a high rate.
          // TODO: allow sending the variables, behaviors and effects still?
          return;
        }

        const areVariablesDifferent =
          objectNetworkSyncData.var &&
          this._areVariablesDifferentFromLastSync(objectNetworkSyncData.var);
        const shouldSyncVariables =
          !this._haveVariablesBeenSyncedRecently() ||
          areVariablesDifferent ||
          this._numberOfForcedVariablesUpdates > 0;
        if (areVariablesDifferent) {
          this._numberOfForcedVariablesUpdates = 3;
        }
        if (!shouldSyncVariables) {
          delete objectNetworkSyncData.var;
        }

        const areEffectsDifferent =
          objectNetworkSyncData.eff &&
          this._areEffectsDifferentFromLastSync(objectNetworkSyncData.eff);
        const shoundSyncEffects =
          !this._haveEffectsBeenSyncedRecently() ||
          areEffectsDifferent ||
          this._numberOfForcedEffectsUpdates > 0;
        if (areEffectsDifferent) {
          this._numberOfForcedEffectsUpdates = 3;
        }
        if (!shoundSyncEffects) {
          delete objectNetworkSyncData.eff;
        }

        const sceneNetworkId = this.owner.getRuntimeScene().networkId;
        if (!sceneNetworkId) {
          // No networkId for the scene yet, it will be set soon, let's not sync the object yet.
          return;
        }

        const {
          messageName: updateMessageName,
          messageData: updateMessageData,
        } = gdjs.multiplayerMessageManager.createUpdateInstanceMessage({
          objectOwner: this.playerNumber,
          objectName,
          instanceNetworkId,
          objectNetworkSyncData,
          sceneNetworkId,
        });
        this._sendDataToPeersWithIncreasedClock(
          updateMessageName,
          updateMessageData
        );

        const now = getTimeNow();

        this._lastObjectSyncTimestamp = now;
        if (shouldSyncObjectBasicInfo) {
          this._lastBasicObjectSyncTimestamp = now;
          this._lastSentControllerPlayerNumber = currentController;
          this._lastSentControlLeaseId = currentLeaseId;
          this._lastSentBasicObjectSyncData = {
            x: objectNetworkSyncData.x,
            y: objectNetworkSyncData.y,
            z: objectNetworkSyncData.z,
            w: objectNetworkSyncData.w,
            h: objectNetworkSyncData.h,
            zo: objectNetworkSyncData.zo,
            a: objectNetworkSyncData.a,
            hid: objectNetworkSyncData.hid,
            lay: objectNetworkSyncData.lay,
            if: objectNetworkSyncData.if,
            pfx: objectNetworkSyncData.pfx,
            pfy: objectNetworkSyncData.pfy,
          };
          this._numberOfForcedBasicObjectUpdates = Math.max(
            this._numberOfForcedBasicObjectUpdates - 1,
            0
          );
        }
        if (shouldSyncVariables) {
          this._lastVariablesSyncTimestamp = now;
          this._lastSentVariableSyncData = objectNetworkSyncData.var;
          this._numberOfForcedVariablesUpdates = Math.max(
            this._numberOfForcedVariablesUpdates - 1,
            0
          );
        }
        if (shoundSyncEffects) {
          this._lastEffectsSyncTimestamp = now;
          this._lastSentEffectSyncData = objectNetworkSyncData.eff;
          this._numberOfForcedEffectsUpdates = Math.max(
            this._numberOfForcedEffectsUpdates - 1,
            0
          );
        }
      } finally {
        this._sendPendingObjectControlRelease();
        this._clearOneFrameControlFlags();
      }
    }

    onDestroy() {
      if (this._destroyInstanceTimeoutId) {
        clearTimeout(this._destroyInstanceTimeoutId);
        this._destroyInstanceTimeoutId = null;
      }

      const instanceNetworkId = this.owner.networkId;
      const sceneNetworkId = this.owner.getRuntimeScene().networkId;

      // If the lobby game is not running, no need to send a message to destroy the object.
      if (!gdjs.multiplayer.isLobbyGameRunning()) {
        return;
      }

      // For destruction of objects, we allow the host to destroy the object even if it is not the owner.
      // This is particularly helpful when a player disconnects, so the host can destroy the object they were owning.
      if (
        !this._isOwnerAsPlayerOrHost() &&
        !gdjs.multiplayer.isCurrentPlayerHost()
      ) {
        return;
      }

      const objectName = this.owner.getName();

      // If it had no networkId, then it was not synchronized and we don't need to send a message.
      if (!instanceNetworkId) {
        debugLogger.info(
          `Destroying object ${objectName} without networkId, no need to send a message.`
        );
        return;
      }

      if (!sceneNetworkId) {
        // No networkId for the scene yet, it will be set soon, let's not sync the object yet.
        return;
      }

      // Ensure we send a final update before the object is destroyed, if it had a networkId.
      const { messageName: updateMessageName, messageData: updateMessageData } =
        gdjs.multiplayerMessageManager.createUpdateInstanceMessage({
          objectOwner: this.playerNumber,
          objectName,
          instanceNetworkId,
          objectNetworkSyncData: this.owner.getNetworkSyncData({}),
          sceneNetworkId,
        });
      this._sendDataToPeersWithIncreasedClock(
        updateMessageName,
        updateMessageData
      );

      // Before sending the destroy message, we set up the object representing the peers
      // that we need an acknowledgment from.
      // If we are the host, we are connected to everyone, so we expect an acknowledgment from everyone.
      // If we are another player, we are only connected to the host, so we expect an acknowledgment from the host.
      // In both cases, this represents the list of peers the current user is connected to.
      const otherPeerIds = gdjs.multiplayerPeerJsHelper.getAllPeers();
      const {
        messageName: destroyMessageName,
        messageData: destroyMessageData,
      } = gdjs.multiplayerMessageManager.createDestroyInstanceMessage({
        objectOwner: this.playerNumber,
        objectName,
        instanceNetworkId,
        sceneNetworkId,
      });
      const destroyedMessageName =
        gdjs.multiplayerMessageManager.createInstanceDestroyedMessageNameFromDestroyInstanceMessage(
          destroyMessageName
        );
      gdjs.multiplayerMessageManager.addExpectedMessageAcknowledgement({
        originalMessageName: destroyMessageName,
        originalData: {
          ...destroyMessageData,
          // As the method `sendDataToPeersWithIncreasedClock` will increment the clock,
          // we increment it here to ensure we can resend the same message if we don't receive an acknowledgment.
          _clock: this._clock + 1,
        },
        expectedMessageName: destroyedMessageName,
        otherPeerIds,
        // Destruction of objects are not reverted, as they will eventually be recreated by an update message.
        shouldCancelMessageIfTimesOut: false,
      });

      this._sendDataToPeersWithIncreasedClock(
        destroyMessageName,
        destroyMessageData
      );
    }

    setPlayerObjectOwnership(newObjectPlayerNumber: number) {
      debugLogger.info(
        `Setting ownership of object ${this.owner.getName()} (networkId: ${
          this.owner.networkId
        } to player ${newObjectPlayerNumber}.`
      );
      if (newObjectPlayerNumber < 0) {
        logger.error(
          'Invalid player number (' +
            newObjectPlayerNumber +
            ') when setting ownership of an object.'
        );
        return;
      }

      // Update the ownership locally, so the object can be used immediately.
      // This is a prediction to allow snappy interactions.
      // If we are host, we will have the ownership immediately anyway.
      // If we are another player, we will have the ownership as soon as the host acknowledges the change.
      // If the host does not send an acknowledgment, we will revert the ownership.
      const previousObjectPlayerNumber = this.playerNumber;
      this.playerNumber = newObjectPlayerNumber;
      const currentPlayerNumber = gdjs.multiplayer.getCurrentPlayerNumber();

      // If the lobby game is not running, do not try to update the ownership over the network,
      // as the game may create & update objects before the lobby game starts.
      if (!gdjs.multiplayer.isLobbyGameRunning()) {
        return;
      }

      let instanceNetworkId = this.owner.networkId;
      if (!instanceNetworkId) {
        debugLogger.info(
          'Object has no networkId, we change the ownership locally, but it will not be synchronized yet if we are not the owner.'
        );
        if (newObjectPlayerNumber !== currentPlayerNumber) {
          // If we are not the new owner, we should not send a message to the host to change the ownership.
          // Just return and wait to receive an update message to reconcile this object.
          return;
        }
        // If we don't have a networkId, we need to create one now that we are the owner.
        // We are probably in a case where we created the object and then changed the ownership.
        debugLogger.info(
          'We are the new owner, creating a networkId for the object.'
        );
        instanceNetworkId = this._getOrCreateInstanceNetworkId();
      }

      const sceneNetworkId = this.owner.getRuntimeScene().networkId;
      if (!sceneNetworkId) {
        // No networkId for the scene yet, it will be set soon, let's not sync the object yet.
        return;
      }

      const objectName = this.owner.getName();

      // When changing the ownership of an object with a networkId, we send a message to the host to ensure it is aware of the change,
      // and can either accept it and broadcast it to other players, or reject it and do nothing with it.
      // We expect an acknowledgment from the host, if not, we will retry and eventually revert the ownership.
      const { messageName, messageData } =
        gdjs.multiplayerMessageManager.createChangeInstanceOwnerMessage({
          objectOwner: previousObjectPlayerNumber,
          objectName,
          instanceNetworkId,
          newObjectOwner: newObjectPlayerNumber,
          instanceX: this.owner.getX(),
          instanceY: this.owner.getY(),
          sceneNetworkId,
        });
      // Before sending the changeOwner message, if we are becoming the new owner,
      // we want to ensure this message is acknowledged, by everyone we're connected to.
      // If we are the host, we are connected to everyone, so we expect an acknowledgment from everyone.
      // If we are another player, we are only connected to the host, so we expect an acknowledgment from the host.
      // In both cases, this represents the list of peers the current user is connected to.
      if (newObjectPlayerNumber === currentPlayerNumber) {
        const otherPeerIds = gdjs.multiplayerPeerJsHelper.getAllPeers();
        const changeOwnerAcknowledgedMessageName =
          gdjs.multiplayerMessageManager.createInstanceOwnerChangedMessageNameFromChangeInstanceOwnerMessage(
            messageName
          );
        gdjs.multiplayerMessageManager.addExpectedMessageAcknowledgement({
          originalMessageName: messageName,
          originalData: {
            ...messageData,
            _clock: this._clock + 1, // Will be incremented by the time the message is sent.
          },
          expectedMessageName: changeOwnerAcknowledgedMessageName,
          otherPeerIds,
          // If we are not the host, we should revert the ownership if the host does not acknowledge the change.
          shouldCancelMessageIfTimesOut:
            !gdjs.multiplayer.isCurrentPlayerHost(),
        });
      }

      debugLogger.info('Sending change owner message', messageName);
      this._sendDataToPeersWithIncreasedClock(messageName, messageData);

      // If we are the new owner, also send directly an update of the position,
      // so that the object is immediately moved on the screen and we don't wait for the next tick.
      if (newObjectPlayerNumber === currentPlayerNumber) {
        debugLogger.info(
          'Sending update message to move the object immediately.'
        );
        const objectNetworkSyncData = this.owner.getNetworkSyncData({});
        const {
          messageName: updateMessageName,
          messageData: updateMessageData,
        } = gdjs.multiplayerMessageManager.createUpdateInstanceMessage({
          objectOwner: this.playerNumber,
          objectName,
          instanceNetworkId,
          objectNetworkSyncData,
          sceneNetworkId,
        });
        this._sendDataToPeersWithIncreasedClock(
          updateMessageName,
          updateMessageData
        );
      }
    }

    getPlayerObjectOwnership(): number {
      return this.playerNumber;
    }

    isObjectOwnedByCurrentPlayer(): boolean {
      return this._isOwnerAsPlayerOrHost();
    }

    isObjectControlledByCurrentPlayer(): boolean {
      return (
        !this._controlReleasePending &&
        this._canCurrentPlayerSynchronizeObject()
      );
    }

    hasCurrentPlayerJustGotObjectControl(): boolean {
      return this._justGotControl;
    }

    wasObjectControlRequestRefused(): boolean {
      return this._controlRequestRefused;
    }

    getPlayerObjectController(): number {
      return this._getEffectiveControllerPlayerNumber();
    }

    requestObjectControl(durationInSeconds: number) {
      const durationInMs =
        this._getValidControlDurationInMs(durationInSeconds);
      if (durationInMs === null) {
        return;
      }

      if (!gdjs.multiplayer.isLobbyGameRunning()) {
        this._applyObjectControlGrant({
          controllerPlayerNumber: gdjs.multiplayer.getCurrentPlayerNumber(),
          leaseId: gdjs.makeUuid().substring(0, 8),
          durationInMs,
          requestId: '',
        });
        return;
      }

      const currentPlayerNumber = gdjs.multiplayer.getCurrentPlayerNumber();
      if (this._canCurrentPlayerSynchronizeObject()) {
        this._applyObjectControlGrant({
          controllerPlayerNumber: currentPlayerNumber,
          leaseId: this._controlLeaseId || gdjs.makeUuid().substring(0, 8),
          durationInMs,
          requestId: '',
        });
        return;
      }

      if (this._controlRequestPending && !this._hasControlRequestTimedOut()) {
        return;
      }

      const sceneNetworkId = this.owner.getRuntimeScene().networkId;
      if (!sceneNetworkId) return;

      const instanceNetworkId = this.owner.networkId;
      if (!instanceNetworkId) {
        logger.error(
          `Cannot request control of object ${this.owner.getName()} because it has no networkId.`
        );
        return;
      }

      const requestId = gdjs.makeUuid().substring(0, 8);
      this._controlRequestPending = true;
      this._controlRequestId = requestId;
      this._controlRequestSentAt = getTimeNow();
      this._controlRequestRefused = false;
      gdjs.multiplayerMessageManager.sendRequestObjectControlMessage({
        objectName: this.owner.getName(),
        instanceNetworkId,
        sceneNetworkId,
        requesterPlayerNumber: currentPlayerNumber,
        requestId,
        durationInMs,
        instanceX: this.owner.getX(),
        instanceY: this.owner.getY(),
      });
    }

    keepObjectControl(durationInSeconds: number) {
      const durationInMs =
        this._getValidControlDurationInMs(durationInSeconds);
      if (
        durationInMs === null ||
        !this._isControlLeaseActive() ||
        !this._canCurrentPlayerSynchronizeObject()
      ) {
        return;
      }

      const now = getTimeNow();
      if (
        now - this._lastControlKeepSentAt <
        this._controlKeepMinIntervalInMs
      ) {
        return;
      }
      this._lastControlKeepSentAt = now;
      this._controlLeaseExpiresAt = now + durationInMs;

      const sceneNetworkId = this.owner.getRuntimeScene().networkId;
      const instanceNetworkId = this.owner.networkId;
      if (!sceneNetworkId || !instanceNetworkId) return;

      gdjs.multiplayerMessageManager.sendKeepObjectControlMessage({
        objectName: this.owner.getName(),
        instanceNetworkId,
        sceneNetworkId,
        controllerPlayerNumber: this._getEffectiveControllerPlayerNumber(),
        leaseId: this._controlLeaseId,
        durationInMs,
      });
    }

    releaseObjectControl() {
      if (
        !this._isControlLeaseActive() ||
        !this._canCurrentPlayerSynchronizeObject()
      ) {
        return;
      }

      this._controlReleasePending = true;
      this._numberOfForcedBasicObjectUpdates = Math.max(
        this._numberOfForcedBasicObjectUpdates,
        1
      );
    }

    _applyObjectControlGrant({
      controllerPlayerNumber,
      leaseId,
      durationInMs,
      requestId,
    }: {
      controllerPlayerNumber: number;
      leaseId: string;
      durationInMs: number;
      requestId: string;
    }) {
      this._controllerPlayerNumber = controllerPlayerNumber;
      this._controlLeaseId = leaseId;
      this._controlLeaseExpiresAt = getTimeNow() + durationInMs;
      if (!requestId || requestId === this._controlRequestId) {
        this._controlRequestPending = false;
        this._controlRequestId = '';
        this._controlRequestSentAt = 0;
      }
      if (this._isCurrentPlayerNumberOrHostForPlayer(controllerPlayerNumber)) {
        this._justGotControl = true;
      }
    }

    _applyObjectControlRefusal(requestId: string) {
      if (requestId && requestId !== this._controlRequestId) return;
      this._controlRequestPending = false;
      this._controlRequestId = '';
      this._controlRequestSentAt = 0;
      this._controlRequestRefused = true;
    }

    _applyObjectControlKeep({
      controllerPlayerNumber,
      leaseId,
      durationInMs,
    }: {
      controllerPlayerNumber: number;
      leaseId: string;
      durationInMs: number;
    }) {
      if (
        this._controllerPlayerNumber !== controllerPlayerNumber ||
        this._controlLeaseId !== leaseId
      ) {
        return;
      }
      this._controlLeaseExpiresAt = getTimeNow() + durationInMs;
    }

    _applyObjectControlRelease({
      controllerPlayerNumber,
      leaseId,
    }: {
      controllerPlayerNumber: number;
      leaseId: string;
    }) {
      if (
        this._controllerPlayerNumber !== controllerPlayerNumber ||
        this._controlLeaseId !== leaseId
      ) {
        return;
      }
      this._clearObjectControlLease();
    }

    _clearObjectControlLease() {
      this._controllerPlayerNumber = null;
      this._controlLeaseId = '';
      this._controlLeaseExpiresAt = 0;
      this._controlRequestPending = false;
      this._controlRequestId = '';
      this._controlRequestSentAt = 0;
      this._controlReleasePending = false;
    }

    removeObjectOwnership() {
      // 0 means the host is the owner.
      this.setPlayerObjectOwnership(0);
    }

    takeObjectOwnership() {
      this.setPlayerObjectOwnership(gdjs.multiplayer.getCurrentPlayerNumber());
    }

    getActionOnPlayerDisconnect() {
      return this.actionOnPlayerDisconnect;
    }

    enableBehaviorSynchronization(behaviorName: string, enable: boolean) {
      const behavior = this.owner.getBehavior(behaviorName);
      if (!behavior) {
        logger.error(
          `Behavior ${behaviorName} does not exist on object ${this.owner.getName()}.`
        );
        return;
      }

      behavior.enableSynchronization(enable);
    }
  }
  gdjs.registerBehavior(
    'Multiplayer::MultiplayerObjectBehavior',
    gdjs.MultiplayerObjectRuntimeBehavior
  );
}
