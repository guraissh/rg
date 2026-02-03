import { useState, useRef, useEffect, useMemo } from 'react';
import tags from '../../tags.json';

// Convert tags object to array for easier filtering
const tagList = Object.entries(tags).map(([key, label]) => ({ key, label }));

function TagSelector({ selectedTags, onTagsChange, onSearch }) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredTags = useMemo(() => {
    if (!inputValue.trim()) {
      // Show popular tags when no input
      return tagList.slice(0, 20);
    }
    const search = inputValue.toLowerCase();
    return tagList
      .filter(tag =>
        tag.key.includes(search) ||
        tag.label.toLowerCase().includes(search)
      )
      .slice(0, 20);
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredTags]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const addTag = (tagKey) => {
    if (!selectedTags.includes(tagKey)) {
      onTagsChange([...selectedTags, tagKey]);
    }
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagKey) => {
    onTagsChange(selectedTags.filter(t => t !== tagKey));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredTags.length > 0) {
        addTag(filteredTags[highlightedIndex].key);
      } else if (selectedTags.length > 0) {
        onSearch();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filteredTags.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTags.length > 0) {
      onSearch();
      setIsOpen(false);
    }
  };

  return (
    <form className="tag-selector" onSubmit={handleSubmit}>
      <div className="tag-selector-input-wrapper">
        <div className="tag-selector-tags">
          {selectedTags.map(tagKey => (
            <span key={tagKey} className="tag-chip">
              {tags[tagKey] || tagKey}
              <button
                type="button"
                className="tag-chip-remove"
                onClick={() => removeTag(tagKey)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="tag-selector-input"
            placeholder={selectedTags.length === 0 ? "Search tags..." : "Add more..."}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          type="submit"
          className="search-btn"
          disabled={selectedTags.length === 0}
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>

      {isOpen && filteredTags.length > 0 && (
        <div ref={dropdownRef} className="tag-dropdown">
          {filteredTags.map((tag, index) => (
            <button
              key={tag.key}
              type="button"
              className={`tag-dropdown-item ${index === highlightedIndex ? 'highlighted' : ''} ${selectedTags.includes(tag.key) ? 'selected' : ''}`}
              onClick={() => addTag(tag.key)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="tag-dropdown-label">{tag.label}</span>
              {selectedTags.includes(tag.key) && (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ color: 'var(--accent-primary)' }}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

export default TagSelector;
