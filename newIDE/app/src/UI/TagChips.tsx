import * as React from 'react';
import Chip, { type ChipInterface } from '../UI/Chip';

type Tags = Array<string>;

type TagsWithLabel = Array<{
  label: string | React.ReactNode;
  value: string;
}>;

const styles: {
  chipContainer: React.CSSProperties;
  chip: React.CSSProperties;
} = {
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    overflowX: 'auto',
    marginTop: 4,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
};

type Props = {
  tags?: Tags;
  tagsWithLabel?: TagsWithLabel;
  onRemove: (arg0: string) => void;
};

const TagChips = ({
  tags,
  tagsWithLabel,
  onRemove,
}: Props): null | React.ReactElement<any> => {
  const [focusedTag, setFocusedTag] = React.useState<string | null | undefined>(
    null
  );
  const tagsRefs = React.useRef<Array<React.RefObject<ChipInterface>>>([]);

  const getChipStyle = React.useCallback(
    (tag: string) => {
      const isFocused = !!focusedTag && focusedTag === tag;
      return {
        ...styles.chip,
        filter: isFocused ? 'brightness(1.2)' : undefined,
      };
    },
    [focusedTag]
  );

  const handleDeleteTag =
    (tag: string) => (event: React.SyntheticEvent<any>) => {
      if (!tags) return;
      const deletedTagIndex = tags.indexOf(tag);
      tagsRefs.current.splice(deletedTagIndex, 1);
      if (event.nativeEvent instanceof KeyboardEvent) {
        const newIndexToFocus = Math.min(
          tagsRefs.current.length - 1,
          deletedTagIndex
        );
        const newTagToFocus = tagsRefs.current[newIndexToFocus];
        if (newTagToFocus && newTagToFocus.current) {
          newTagToFocus.current.focus();
        }
      }
      onRemove(tag);
    };

  const handleDeleteTagWithLabel =
    (tagValue: string) => (event: React.SyntheticEvent<any>) => {
      if (!tagsWithLabel) return;
      const deletedTagIndex = tagsWithLabel.findIndex(
        (tagWithLabel) => tagWithLabel.value === tagValue
      );
      tagsRefs.current.splice(deletedTagIndex, 1);
      if (event.nativeEvent instanceof KeyboardEvent) {
        const newIndexToFocus = Math.min(
          tagsRefs.current.length - 1,
          deletedTagIndex
        );
        const newTagToFocus = tagsRefs.current[newIndexToFocus];
        if (newTagToFocus && newTagToFocus.current) {
          newTagToFocus.current.focus();
        }
      }
      onRemove(tagValue);
    };

  if ((!tags || !tags.length) && (!tagsWithLabel || !tagsWithLabel.length))
    return null;

  return (
    <div style={styles.chipContainer}>
      {tags &&
        tags.map((tag, index) => {
          const newRef = React.createRef<ChipInterface>();
          tagsRefs.current[index] = newRef;
          return (
            <Chip
              key={tag}
              size="small"
              style={getChipStyle(tag)}
              onBlur={() => setFocusedTag(null)}
              onFocus={() => setFocusedTag(tag)}
              onDelete={handleDeleteTag(tag)}
              label={tag}
              ref={newRef}
            />
          );
        })}
      {tagsWithLabel &&
        tagsWithLabel.map((tag, index) => {
          const newRef = React.createRef<ChipInterface>();
          tagsRefs.current[index] = newRef;
          return (
            <Chip
              key={tag.value}
              size="small"
              style={getChipStyle(tag.value)}
              onBlur={() => setFocusedTag(null)}
              onFocus={() => setFocusedTag(tag.value)}
              onDelete={handleDeleteTagWithLabel(tag.value)}
              label={tag.label}
              ref={newRef}
            />
          );
        })}
    </div>
  );
};

export default TagChips;
