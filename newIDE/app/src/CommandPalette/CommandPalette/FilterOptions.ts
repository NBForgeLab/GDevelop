import { fuzzyOrEmptyFilter } from '../../Utils/FuzzyOrEmptyFilter';

/**
 * Filters options both simply and fuzzy-ly,
 * prioritizing simple-matched options
 */
const filterOptions = <T extends Record<string, any>>(
  options: Array<T>,
  state: {
    getOptionLabel: (t: T) => string;
    inputValue: string;
  }
): Array<T> => {
  const searchText = state.inputValue.toLowerCase();
  if (searchText === '') return options;

  const directMatches: Array<T> = [];
  const fuzzyMatches: Array<T> = [];
  options.forEach((option) => {
    if (option.hit) {
      directMatches.push(option);
      return;
    }
    const optionText = state.getOptionLabel(option).toLowerCase();
    if (optionText.includes(searchText)) {
      directMatches.push(option);
      return;
    }
    if (fuzzyOrEmptyFilter(searchText, optionText)) {
      fuzzyMatches.push(option);
    }
  });

  return [...directMatches, ...fuzzyMatches];
};

export default filterOptions;
