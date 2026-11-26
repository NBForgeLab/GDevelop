import * as React from 'react';
import TeamProvider from '../Profile/Team/TeamProvider';
import TeamContext from '../Profile/Team/TeamContext';
import LeaderboardProvider from '../Leaderboard/LeaderboardProvider';
import LeaderboardContext from '../Leaderboard/LeaderboardContext';
import { act, create } from 'react-test-renderer';
import RouterContext, { RouterContextProvider } from './RouterContext';
import CourseStoreContext, {
  CourseStoreStateProvider,
} from '../Course/CourseStoreContext';
import AlertContext from '../UI/Alert/AlertContext';
import AlertProvider from '../UI/Alert/AlertProvider';
import InAppTutorialContext from '../InAppTutorial/InAppTutorialContext';
import InAppTutorialProvider from '../InAppTutorial/InAppTutorialProvider';
import PrivateAssetsAuthorizationContext from '../AssetStore/PrivateAssets/PrivateAssetsAuthorizationContext';
import PrivateAssetsAuthorizationProvider from '../AssetStore/PrivateAssets/PrivateAssetsAuthorizationProvider';
import Window from '../Utils/Window';
import {
  getAuthorizationTokenForPrivateAssets,
  listListedCourses,
} from '../Utils/GDevelopServices/Shop';
import AuthenticatedUserContext from '../Profile/AuthenticatedUserContext';

jest.mock('../Utils/Window', () => ({
  isDev: () => false,
  getArguments: jest.fn(),
  addArguments: jest.fn(),
  isRunningCommandFromCli: () => false,
}));
jest.mock('../Utils/GDevelopServices/Shop', () => ({
  listListedCourses: jest.fn(),
  getAuthorizationTokenForPrivateAssets: jest.fn(),
}));
jest.mock('../AssetStore/InstallAsset', () => ({}));
jest.mock('../Utils/Analytics/EventSender', () => ({
  setCurrentlyRunningInAppTutorial: jest.fn(),
}));
jest.mock('../UI/Alert/AlertDialog', () => () => null);
jest.mock('../UI/Alert/ConfirmDialog', () => () => null);
jest.mock('../UI/Alert/ConfirmDeleteDialog', () => () => null);
jest.mock('../UI/Alert/YesNoCancelDialog', () => () => null);

function observeContext<T>(
  Provider: React.ComponentType<{ children: React.ReactNode }>,
  Context: React.Context<T>
) {
  const values: Array<T> = [];
  const Consumer = React.memo(() => {
    values.push(React.useContext(Context));
    return null;
  });
  const render = () => (
    <Provider>
      <Consumer />
    </Provider>
  );
  let tree: any;
  act(() => {
    tree = create(render());
  });
  return {
    values,
    rerender: () => act(() => tree.update(render())),
    unmount: () => act(() => tree.unmount()),
  };
}

describe('editor context updates', () => {
  beforeEach(() => {
    (Window.getArguments as jest.Mock).mockReturnValue({});
    (listListedCourses as jest.Mock).mockReturnValue(new Promise(() => {}));
  });

  it.each([
    ['router', RouterContextProvider, RouterContext],
    ['team', TeamProvider, TeamContext],
    ['leaderboards', LeaderboardProvider, LeaderboardContext],
    ['courses', CourseStoreStateProvider, CourseStoreContext],
    ['alerts', AlertProvider, AlertContext],
    ['guided lessons', InAppTutorialProvider, InAppTutorialContext],
    [
      'private assets',
      PrivateAssetsAuthorizationProvider,
      PrivateAssetsAuthorizationContext,
    ],
  ])(
    '%s keeps consumers stable across parent renders',
    (_, Provider: React.ComponentType<any>, Context: React.Context<any>) => {
      const { values, rerender, unmount } = observeContext(Provider, Context);
      try {
        const rendersAfterMount = values.length;
        expect(rendersAfterMount).toBeGreaterThan(0);
        rerender();
        expect(values).toHaveLength(rendersAfterMount);
      } finally {
        unmount();
      }
    }
  );

  it('publishes new route arguments when navigating', () => {
    const { values, unmount } = observeContext(
      RouterContextProvider,
      RouterContext
    );
    try {
      act(() => values[0].navigateToRoute('learn', { 'course-id': 'abc' }));
      expect(values[1].routeArguments).toEqual({
        'initial-dialog': 'learn',
        'course-id': 'abc',
      });
    } finally {
      unmount();
    }
  });

  it('publishes the course list after the request resolves', async () => {
    const courses = [{ id: 'abc' }];
    (listListedCourses as jest.Mock).mockResolvedValue(courses);
    const { values, unmount } = observeContext(
      CourseStoreStateProvider,
      CourseStoreContext
    );
    try {
      await act(async () => {});
      expect(values.map((value) => value.listedCourses)).toEqual([
        null,
        courses,
      ]);
    } finally {
      unmount();
    }
  });

  it('publishes refreshed private asset authorization for the current profile', async () => {
    let authorization: any;
    function Consumer() {
      authorization = React.useContext(PrivateAssetsAuthorizationContext);
      return null;
    }
    const render = (user: any) => (
      <AuthenticatedUserContext.Provider value={user}>
        <PrivateAssetsAuthorizationProvider>
          <Consumer />
        </PrivateAssetsAuthorizationProvider>
      </AuthenticatedUserContext.Provider>
    );
    const first = {
      profile: { id: 'first' },
      getAuthorizationHeader: jest.fn(),
    };
    const second = {
      profile: { id: 'second' },
      getAuthorizationHeader: jest.fn(),
    };
    const tree = create(render(first));
    try {
      (getAuthorizationTokenForPrivateAssets as jest.Mock)
        .mockResolvedValueOnce('first-token')
        .mockResolvedValueOnce('second-token');
      await act(async () => {
        await authorization.updateAuthorizationToken();
      });
      expect(authorization.authorizationToken).toBe('first-token');
      tree.update(render(second));
      await act(async () => {
        await authorization.updateAuthorizationToken();
      });
      expect(getAuthorizationTokenForPrivateAssets).toHaveBeenLastCalledWith(
        second.getAuthorizationHeader,
        { userId: 'second' }
      );
      expect(authorization.authorizationToken).toBe('second-token');
    } finally {
      tree.unmount();
    }
  });
});
