const { click } = require('../lib/PageDriver');

const describe = page =>
  page.evaluate(() => {
    const input = document.querySelector('#storybook-root input#X');
    const json = document.querySelector('#storybook-root pre');
    return {
      value: input && input.value,
      focused: !!input && document.activeElement === input,
      savedX: json && JSON.parse(json.textContent).x,
    };
  });

const helper = {
  name: 'instance-properties',
  paths: [
    'newIDE/app/src/InstancesEditor/CompactInstancePropertiesEditor/',
    'newIDE/app/src/CompactPropertiesEditor/',
    'newIDE/app/src/PropertiesEditor/',
  ],
  describe,
  check: async page => {
    const { value, savedX } = await describe(page);
    return {
      problems:
        value == null || savedX == null
          ? ['Missing X field or serialized instance']
          : [],
    };
  },
  checkExpectation: (expected, state) =>
    Object.keys(expected)
      .filter(key => expected[key] !== state[key])
      .map(key => `Expected ${key} to be ${expected[key]}, got ${state[key]}`),
  actions: {
    selectX: {
      describe: () => 'Select the current X coordinate',
      run: async page => {
        await page.click('input#X');
        await page.keyboard.down('Control');
        try {
          await page.keyboard.press('a');
        } finally {
          await page.keyboard.up('Control');
        }
      },
      expect: () => ({ focused: true }),
    },
    typeDigit: {
      describe: ({ digit }) => `Type ${digit} into the focused field`,
      run: async (page, { digit }) => {
        await page.keyboard.type(digit);
      },
      expect: (_, { value }) => ({ focused: true, value }),
    },
    saveX: {
      describe: () => 'Commit the edit and read the serialized instance',
      run: async page => {
        await page.keyboard.press('Tab');
        await click(page, { button: 'Update' });
      },
      expect: (_, { x }) => ({ savedX: x }),
    },
  },
};

module.exports = [
  {
    name: 'instance-properties/keep-focus-while-typing',
    helper,
    story: 'layouteditor-compactinstancepropertieseditor--instance-sprite-2-d',
    steps: [
      ['selectX', {}],
      ['typeDigit', { digit: '1', value: '1' }],
      ['typeDigit', { digit: '2', value: '12' }],
      ['typeDigit', { digit: '3', value: '123' }],
      ['saveX', { x: 123 }],
    ],
  },
];
