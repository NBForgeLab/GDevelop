import * as React from 'react';
import { type SelectionState, getSelectedEvents } from './SelectionHandler';
import { mapFor } from '../Utils/MapFor';
import uniqBy from 'lodash/uniqBy';
import type { SearchFilterParams } from '../Utils/Search';
const gd: libGDevelop = (global as any).gd;

export type SearchInEventsInputs = {
  searchInSelection: boolean;
  searchText: string;
  searchFilterParams: Required<
    Omit<SearchFilterParams, 'includeStoreExtensions'>
  >;
};

export type ReplaceInEventsInputs = {
  searchInSelection: boolean;
  searchText: string;
  replaceText: string;
  matchCase: boolean;
  searchInConditions: boolean;
  searchInActions: boolean;
  searchInEventStrings: boolean;
};

type State = {
  eventsSearchResults: gdVectorEventsSearchResult | null | undefined;
  searchFocusOffset: number | null | undefined;
};

type Props = {
  globalObjectsContainer: gdObjectsContainer;
  objectsContainer: gdObjectsContainer;
  events: gdEventsList;
  selection: SelectionState;
  project: gdProject;
  children: (props: {
    eventsSearchResultEvents: Array<gdBaseEvent> | null | undefined;
    searchFocusOffset: number | null | undefined;
    searchInEvents: (
      searchInEventsInputs: SearchInEventsInputs,
      cb: () => void
    ) => void;
    replaceInEvents: (
      replaceInEventsInputs: ReplaceInEventsInputs,
      cb: () => void
    ) => Array<gdBaseEvent>;
    goToNextSearchResult: () => gdBaseEvent | null | undefined;
    goToPreviousSearchResult: () => gdBaseEvent | null | undefined;
    clearSearchResults: () => void;
  }) => React.ReactNode;
};

const cloneEventsSearchResults = (
  results: gdVectorEventsSearchResult
): gdVectorEventsSearchResult =>
  (
    results as gdVectorEventsSearchResult & {
      clone: () => gdVectorEventsSearchResult;
    }
  ).clone();

const deduplicateEventSearchResults = (
  eventsSearchResults: gdVectorEventsSearchResult
) => {
  const resultEventsWithDuplicates = mapFor(
    0,
    eventsSearchResults.size(),
    (eventIndex) => {
      const eventsSearchResult = eventsSearchResults.at(eventIndex);
      return eventsSearchResult.isEventValid()
        ? eventsSearchResult.getEvent()
        : null;
    }
  ).filter((event): event is gdBaseEvent => Boolean(event));

  // Store a list of unique events, because browsing for results in the events
  // tree is made event by event.
  return uniqBy<gdBaseEvent>(resultEventsWithDuplicates, (event) => event.ptr);
};

/**
 * Computes the positions of the first selected event and the search results
 * in the flatten event tree and looks for the search result just after the
 * first selected event.
 */
const getSearchInitialOffset = (
  events: gdEventsList,
  resultEvents: Array<gdBaseEvent>,
  selection: SelectionState
): number => {
  const selectedEvents = getSelectedEvents(selection);
  if (!selectedEvents.length) return 0;

  const eventsToSearch = [selectedEvents[0], ...resultEvents];

  const positionFinder = new gd.EventsPositionFinder();
  eventsToSearch.forEach((event) => positionFinder.addEventToSearch(event));
  positionFinder.launch(events);
  const positionsVector = positionFinder.getPositions() as gdVectorInt & {
    toJSArray: () => Array<number>;
  };
  const [selectedEventPosition, ...searchResultsPositions] =
    positionsVector.toJSArray();
  positionFinder.delete();

  // Search results are considered to be sorted by position
  // (top to bottom in the flatten event tree)
  for (
    let searchResultIndex = 0;
    searchResultIndex < searchResultsPositions.length;
    searchResultIndex++
  ) {
    if (searchResultsPositions[searchResultIndex] >= selectedEventPosition) {
      return searchResultIndex;
    }
  }
  return 0;
};

/**
 * Component allowing to do search in events and pass the results
 * to its children components, as well as methods to browse the results.
 */
export default class EventsSearcher extends React.Component<Props, State> {
  state: State = {
    eventsSearchResults: null, // The list of results
    searchFocusOffset: null,
  };

  // The list containing the raw events results. Should be derived from this.state.eventsSearchResults using
  // this._updateListOfResultEvents before being used.
  _resultEvents: Array<gdBaseEvent> | null | undefined = null;

  componentWillUnmount() {
    this.reset();
  }

  reset = () => {
    if (this.state.eventsSearchResults) this.state.eventsSearchResults.delete();

    this._resultEvents = null;
    this.setState({
      eventsSearchResults: null,
      searchFocusOffset: null,
    });
  };

  _doReplaceInEvents = (
    {
      searchInSelection,
      searchText,
      replaceText,
      matchCase,
      searchInConditions,
      searchInActions,
      searchInEventStrings,
    }: ReplaceInEventsInputs,
    cb: () => void
  ): Array<gdBaseEvent> => {
    const { globalObjectsContainer, objectsContainer, events } = this.props;

    if (searchInSelection) {
      // Replace in selection is a bit tricky to implement as it requires to have a list
      // of events (gd.EventsList) pointing to the same events. Need some workaround/helper
      // function to be done in C++.
      console.error('Replace in selection is not implemented yet');
    }

    const modifiedEvents = gd.EventsRefactorer.replaceStringInEvents(
      globalObjectsContainer,
      objectsContainer,
      events,
      searchText,
      replaceText,
      matchCase,
      searchInConditions,
      searchInActions,
      searchInEventStrings
    );

    if (this.state.eventsSearchResults) {
      this.state.eventsSearchResults.delete();
    }
    this.setState(
      {
        eventsSearchResults: cloneEventsSearchResults(modifiedEvents),
        searchFocusOffset: null,
      },
      () => {
        this._updateListOfResultEvents();
        cb();
      }
    );
    return deduplicateEventSearchResults(modifiedEvents);
  };

  _doSearchInEvents = (
    { searchInSelection, searchText, searchFilterParams }: SearchInEventsInputs,
    cb: () => void
  ) => {
    const {
      matchCase,
      searchInConditions,
      searchInActions,
      searchInEventStrings,
      searchInInstructionNames,
      searchInEventSentences,
    } = searchFilterParams;
    const { events } = this.props;

    if (searchInSelection) {
      // Search in selection is a bit tricky to implement as it requires to have a list
      // of events (gd.EventsList) pointing to the same events. Need some workaround/helper
      // function to be done in C++.
      console.error('Search in selection is not implemented yet');
    }

    const newEventsSearchResults = gd.EventsRefactorer.searchInEvents(
      this.props.project.getCurrentPlatform(),
      events,
      searchText,
      matchCase,
      searchInConditions,
      searchInActions,
      searchInEventStrings,
      searchInEventSentences,
      searchInInstructionNames
    );

    if (this.state.eventsSearchResults) {
      this.state.eventsSearchResults.delete();
    }
    this.setState(
      {
        eventsSearchResults: cloneEventsSearchResults(newEventsSearchResults),
        searchFocusOffset: null,
      },
      () => {
        this._updateListOfResultEvents();
        cb();
      }
    );
  };

  _updateListOfResultEvents = () => {
    const { eventsSearchResults } = this.state;
    if (!eventsSearchResults) {
      this._resultEvents = null;
      return;
    }

    this._resultEvents = deduplicateEventSearchResults(eventsSearchResults);
  };

  _goToSearchResults = (step: number): gdBaseEvent | null | undefined => {
    this._updateListOfResultEvents();
    if (!this._resultEvents || this._resultEvents.length === 0) {
      this.setState({ searchFocusOffset: null });
      return null;
    }

    const { searchFocusOffset } = this.state;

    let newSearchFocusOffset =
      searchFocusOffset === null || searchFocusOffset === undefined
        ? getSearchInitialOffset(
            this.props.events,
            this._resultEvents,
            this.props.selection
          )
        : (searchFocusOffset + step) % this._resultEvents.length;
    if (newSearchFocusOffset < 0)
      newSearchFocusOffset += this._resultEvents.length;

    const event = this._resultEvents[newSearchFocusOffset];
    setTimeout(
      // Change the offset on next tick to give a chance to children to unfold events before focusing it.
      () => this.setState({ searchFocusOffset: newSearchFocusOffset }),
      0
    );
    return event;
  };

  _goToPreviousSearchResult = (): gdBaseEvent | null | undefined => {
    return this._goToSearchResults(-1);
  };

  _goToNextSearchResult = (): gdBaseEvent | null | undefined => {
    return this._goToSearchResults(+1);
  };

  render(): React.ReactNode {
    return this.props.children({
      eventsSearchResultEvents: this._resultEvents,
      searchFocusOffset: this.state.searchFocusOffset,
      searchInEvents: this._doSearchInEvents,
      replaceInEvents: this._doReplaceInEvents,
      goToNextSearchResult: this._goToNextSearchResult,
      goToPreviousSearchResult: this._goToPreviousSearchResult,
      clearSearchResults: this.reset,
    });
  }
}
