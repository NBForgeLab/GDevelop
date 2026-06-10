// @flow
import {
  getHighlightSearchTextParts,
  mergeStylizedText,
  applySyntaxColoring,
} from './HighlightSearchText';
import { makeTestProject } from '../fixtures/TestProject';

const gd: libGDevelop = global.gd;

describe('HighlightSearchText', () => {
  describe('getHighlightSearchTextParts', () => {
    it('can find an occurrence in a text', () => {
      expect(
        getHighlightSearchTextParts(
          '"Lorem ipsum" + "dolor sit amet"',
          'ipsum',
          {
            className: 'Highlighted',
          }
        )
      ).toMatchInlineSnapshot(
        `
  [
    {
      "endIndex": 7,
      "key": "ipsum-0",
      "props": {},
      "startIndex": 0,
    },
    {
      "endIndex": 12,
      "key": "ipsum-1",
      "props": {
        "className": "Highlighted",
      },
      "startIndex": 7,
    },
    {
      "endIndex": 32,
      "key": "ipsum-2",
      "props": {},
      "startIndex": 12,
    },
  ]
`
      );
    });
  });

  describe('applySyntaxColoring', () => {
    it('can apply syntax coloring on an expression', () => {
      const {
        project,
        testSceneProjectScopedContainersAccessor,
      } = makeTestProject(gd);
      const text = '"Lorem ipsum" + "dolor sit amet"';
      const parser = new gd.ExpressionParser2();
      const rootNode = parser.parseExpression(text).get();
      expect(
        applySyntaxColoring({
          text,
          platform: project.getCurrentPlatform(),
          projectScopedContainers: testSceneProjectScopedContainersAccessor.get(),
          rootType: 'number',
          rootNode,
        })
      ).toMatchInlineSnapshot(
        `
    [
      {
        "endIndex": 13,
        "key": "color-part-0",
        "props": {
          "className": "instruction-parameter string",
        },
        "startIndex": 0,
      },
      {
        "endIndex": 16,
        "key": "color-part-1",
        "props": {
          "className": "instruction-parameter operator",
        },
        "startIndex": 13,
      },
      {
        "endIndex": 32,
        "key": "color-part-2",
        "props": {
          "className": "instruction-parameter string",
        },
        "startIndex": 16,
      },
    ]
  `
      );
      parser.delete();
    });
  });

  describe('mergeStylizedText', () => {
    it('can merge syntax coloring and search highlight with highlight over 1 color', () => {
      const {
        project,
        testSceneProjectScopedContainersAccessor,
      } = makeTestProject(gd);
      const text = '"Lorem ipsum" + "dolor sit amet"';
      const parser = new gd.ExpressionParser2();
      const rootNode = parser.parseExpression(text).get();
      expect(
        mergeStylizedText(
          getHighlightSearchTextParts(
            '"Lorem ipsum" + "dolor sit amet"',
            'ipsum',
            {
              className: 'Highlighted',
            }
          ),
          applySyntaxColoring({
            text,
            platform: project.getCurrentPlatform(),
            projectScopedContainers: testSceneProjectScopedContainersAccessor.get(),
            rootType: 'number',
            rootNode,
          })
        )
      ).toMatchInlineSnapshot(
        `
        [
          {
            "children": [
              {
                "endIndex": 7,
                "key": "color-part-0",
                "props": {
                  "className": "instruction-parameter string",
                },
                "startIndex": 0,
              },
            ],
            "endIndex": 7,
            "key": "ipsum-0",
            "props": {},
            "startIndex": 0,
          },
          {
            "children": [
              {
                "endIndex": 12,
                "key": "color-part-0",
                "props": {
                  "className": "instruction-parameter string",
                },
                "startIndex": 7,
              },
            ],
            "endIndex": 12,
            "key": "ipsum-1",
            "props": {
              "className": "Highlighted",
            },
            "startIndex": 7,
          },
          {
            "children": [
              {
                "endIndex": 13,
                "key": "color-part-0",
                "props": {
                  "className": "instruction-parameter string",
                },
                "startIndex": 12,
              },
              {
                "endIndex": 16,
                "key": "color-part-1",
                "props": {
                  "className": "instruction-parameter operator",
                },
                "startIndex": 13,
              },
              {
                "endIndex": 32,
                "key": "color-part-2",
                "props": {
                  "className": "instruction-parameter string",
                },
                "startIndex": 16,
              },
            ],
            "endIndex": 32,
            "key": "ipsum-2",
            "props": {},
            "startIndex": 12,
          },
        ]
      `
      );
      parser.delete();
    });
    it('can merge syntax coloring and search highlight with highlight over several colors', () => {
      const {
        project,
        testSceneProjectScopedContainersAccessor,
      } = makeTestProject(gd);
      const text = '"Lorem ipsum" + "dolor sit amet"';
      const parser = new gd.ExpressionParser2();
      const rootNode = parser.parseExpression(text).get();
      expect(
        mergeStylizedText(
          getHighlightSearchTextParts(
            '"Lorem ipsum" + "dolor sit amet"',
            'ipsum" + "dolor',
            {
              className: 'Highlighted',
            }
          ),
          applySyntaxColoring({
            text,
            platform: project.getCurrentPlatform(),
            projectScopedContainers: testSceneProjectScopedContainersAccessor.get(),
            rootType: 'number',
            rootNode,
          })
        )
      ).toMatchInlineSnapshot(`
                  [
                    {
                      "children": [
                        {
                          "endIndex": 7,
                          "key": "color-part-0",
                          "props": {
                            "className": "instruction-parameter string",
                          },
                          "startIndex": 0,
                        },
                      ],
                      "endIndex": 7,
                      "key": "ipsum" + "dolor-0",
                      "props": {},
                      "startIndex": 0,
                    },
                    {
                      "children": [
                        {
                          "endIndex": 13,
                          "key": "color-part-0",
                          "props": {
                            "className": "instruction-parameter string",
                          },
                          "startIndex": 7,
                        },
                        {
                          "endIndex": 16,
                          "key": "color-part-1",
                          "props": {
                            "className": "instruction-parameter operator",
                          },
                          "startIndex": 13,
                        },
                        {
                          "endIndex": 22,
                          "key": "color-part-2",
                          "props": {
                            "className": "instruction-parameter string",
                          },
                          "startIndex": 16,
                        },
                      ],
                      "endIndex": 22,
                      "key": "ipsum" + "dolor-1",
                      "props": {
                        "className": "Highlighted",
                      },
                      "startIndex": 7,
                    },
                    {
                      "children": [
                        {
                          "endIndex": 32,
                          "key": "color-part-2",
                          "props": {
                            "className": "instruction-parameter string",
                          },
                          "startIndex": 22,
                        },
                      ],
                      "endIndex": 32,
                      "key": "ipsum" + "dolor-2",
                      "props": {},
                      "startIndex": 22,
                    },
                  ]
                `);
      parser.delete();
    });
  });
});
