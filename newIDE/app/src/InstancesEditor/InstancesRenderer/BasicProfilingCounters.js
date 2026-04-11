// @flow

type InstanceCounter = {
  updateCount: number,
  totalUpdateTime: number,
};

export type BasicProfilingCounters = {
  instanceCounters: { [string]: InstanceCounter },
  totalInstancesUpdateCount: number,
  totalInstancesUpdateTime: number,
  totalSceneRenderingTime: number,
  totalUiRenderingTime: number,
  totalThreeRenderingTime: number,
};

export const makeBasicProfilingCounters = (): BasicProfilingCounters => {
  return {
    instanceCounters: {},
    totalInstancesUpdateCount: 0,
    totalInstancesUpdateTime: 0,
    totalSceneRenderingTime: 0,
    totalUiRenderingTime: 0,
    totalThreeRenderingTime: 0,
  };
};

export const resetBasicProfilingCounters = (
  basicProfilingCounters: BasicProfilingCounters
): BasicProfilingCounters => {
  basicProfilingCounters.instanceCounters = {};
  basicProfilingCounters.totalInstancesUpdateCount = 0;
  basicProfilingCounters.totalInstancesUpdateTime = 0;
  basicProfilingCounters.totalSceneRenderingTime = 0;
  basicProfilingCounters.totalUiRenderingTime = 0;
  basicProfilingCounters.totalThreeRenderingTime = 0;
  return basicProfilingCounters;
};

export const increaseInstanceUpdate = (
  basicProfilingCounters: BasicProfilingCounters,
  objectName: string,
  updateDuration: number
) => {
  let instanceCounter = basicProfilingCounters.instanceCounters[objectName];
  if (!instanceCounter) {
    basicProfilingCounters.instanceCounters[objectName] = {
      updateCount: 1,
      totalUpdateTime: updateDuration,
    };
  } else {
    instanceCounter.updateCount++;
    instanceCounter.totalUpdateTime += updateDuration;
  }
  basicProfilingCounters.totalInstancesUpdateCount++;
  basicProfilingCounters.totalInstancesUpdateTime += updateDuration;
};

export const increaseSceneRenderingTime = (
  basicProfilingCounters: BasicProfilingCounters,
  sceneRenderingTime: number
) => {
  basicProfilingCounters.totalSceneRenderingTime += sceneRenderingTime;
};

export const increaseUiRenderingTime = (
  basicProfilingCounters: BasicProfilingCounters,
  uiRenderingTime: number
) => {
  basicProfilingCounters.totalUiRenderingTime += uiRenderingTime;
};

export const increaseThreeRenderingTime = (
  basicProfilingCounters: BasicProfilingCounters,
  threeRenderingTime: number
) => {
  basicProfilingCounters.totalThreeRenderingTime += threeRenderingTime;
};

export const mergeBasicProfilingCounters = (
  destination: BasicProfilingCounters,
  source: BasicProfilingCounters
): BasicProfilingCounters => {
  for (const objectName in source.instanceCounters) {
    if (source.instanceCounters.hasOwnProperty(objectName)) {
      const instanceCounter = source.instanceCounters[objectName];
      let destinationInstanceCounter = destination.instanceCounters[objectName];
      if (!destinationInstanceCounter) {
        destinationInstanceCounter = destination.instanceCounters[
          objectName
        ] = {
          updateCount: 0,
          totalUpdateTime: 0,
        };
      }
      // $FlowFixMe[incompatible-type]
      destinationInstanceCounter.updateCount += instanceCounter.updateCount;
      // $FlowFixMe[incompatible-type]
      destinationInstanceCounter.totalUpdateTime +=
        instanceCounter.totalUpdateTime;
    }
  }
  destination.totalInstancesUpdateCount += source.totalInstancesUpdateCount;
  destination.totalInstancesUpdateTime += source.totalInstancesUpdateTime;
  destination.totalSceneRenderingTime += source.totalSceneRenderingTime;
  destination.totalUiRenderingTime += source.totalUiRenderingTime;
  destination.totalThreeRenderingTime += source.totalThreeRenderingTime;
  return destination;
};

export const getBasicProfilingCountersText = (
  basicProfilingCounters: BasicProfilingCounters
): string => {
  const texts = [];
  texts.push(
    `Instances update count: ${
      basicProfilingCounters.totalInstancesUpdateCount
    }`
  );
  texts.push(
    `Instances update time: ${basicProfilingCounters.totalInstancesUpdateTime.toFixed(
      2
    )}ms`
  );
  texts.push(
    `Scene rendering time: ${basicProfilingCounters.totalSceneRenderingTime.toFixed(
      2
    )}ms`
  );
  texts.push(
    `Three rendering time: ${basicProfilingCounters.totalThreeRenderingTime.toFixed(
      2
    )}ms`
  );
  texts.push(
    `UI rendering time: ${basicProfilingCounters.totalUiRenderingTime.toFixed(
      2
    )}ms`
  );
  texts.push(' ');
  for (const objectName in basicProfilingCounters.instanceCounters) {
    const instanceCounters =
      basicProfilingCounters.instanceCounters[objectName];
    texts.push(
      `${objectName}: ${
        instanceCounters.updateCount
      } updates, ${instanceCounters.totalUpdateTime.toFixed(2)}ms`
    );
  }

  return texts.join('\n');
};
