import * as React from 'react';
import RuntimeObjectInspector from './Inspectors/RuntimeObjectInspector';
import VariablesContainerInspector from './Inspectors/VariablesContainerInspector';
import RuntimeSceneInspector from './Inspectors/RuntimeSceneInspector';

export type GameData = any;
export type EditFunction = (path: Array<string>, newValue: any) => boolean;
export type CallFunction = (path: Array<string>, args: Array<any>) => boolean;

export type InspectorDescriptionsGetter = (
  gameData: GameData
) => Array<InspectorDescription>;

export type InspectorDescription = {
  label: string;
  key: string | Array<string>;
  renderInspector: (
    gameData: GameData,
    arg1: {
      onCall: CallFunction;
      onEdit: EditFunction;
    }
  ) => React.ReactNode;
  getSubInspectors?: InspectorDescriptionsGetter;
  initiallyOpen?: boolean;
};

/**
 * Returns the list of inspectors, given the data coming from a GDJS RuntimeGame.
 * @param {*} gdjsRuntimeGame
 */
export const getInspectorDescriptions = (
  gdjsRuntimeGame: GameData
): Array<InspectorDescription> => {
  return [
    {
      label: 'Global variables',
      key: '_variables',
      renderInspector: (gameData, { onCall, onEdit }) => (
        <VariablesContainerInspector
          variablesContainer={gameData}
          onCall={onCall}
          onEdit={onEdit}
        />
      ),
    },
    {
      label: 'Scenes',
      key: ['_sceneStack', '_stack'],
      renderInspector: () => null,
      initiallyOpen: true,
      getSubInspectors: (gdjsStack: any) => {
        if (!gdjsStack) return [];

        return gdjsStack.map(
          (runtimeScene: any, index: number): InspectorDescription => ({
            label: runtimeScene._name,
            key: String(index),
            renderInspector: (gameData, { onCall, onEdit }) => (
              <RuntimeSceneInspector
                runtimeScene={gameData}
                onCall={onCall}
                onEdit={onEdit}
              />
            ),
            initiallyOpen: true,
            getSubInspectors: (runtimeScene: any) => [
              {
                label: 'Scene variables',
                key: `_variables`,
                renderInspector: (gameData, { onCall, onEdit }) => (
                  <VariablesContainerInspector
                    variablesContainer={gameData}
                    onCall={onCall}
                    onEdit={onEdit}
                  />
                ),
              },
              {
                label: 'Instances',
                key: `_instances`,
                renderInspector: () => null,
                initiallyOpen: true,
                getSubInspectors: (instances: any) => {
                  if (!instances || !instances.items) return [];

                  return Object.keys(instances.items).reduce<
                    Array<InspectorDescription>
                  >((acc, objectName) => {
                    if (
                      !instances.items[objectName] ||
                      typeof instances.items[objectName].length === 'undefined'
                    )
                      return acc;

                    acc.push({
                      label: `${objectName} (${
                        instances.items[objectName].length
                      })`,
                      key: ['items', objectName],
                      renderInspector: () => null,
                      getSubInspectors: (instancesList: any) =>
                        instancesList
                          ? instancesList
                              .filter((runtimeObject: any) => !!runtimeObject)
                              .map(
                                (
                                  runtimeObject: any,
                                  index: number
                                ): InspectorDescription => {
                                  return {
                                    label: `#${runtimeObject.id}`,
                                    key: String(index),
                                    renderInspector: (
                                      gameData,
                                      { onCall, onEdit }
                                    ) => (
                                      <RuntimeObjectInspector
                                        runtimeObject={gameData}
                                        onCall={onCall}
                                        onEdit={onEdit}
                                      />
                                    ),
                                  };
                                }
                              )
                          : [],
                    });
                    return acc;
                  }, []);
                },
              },
            ],
          })
        );
      },
    },
  ];
};
