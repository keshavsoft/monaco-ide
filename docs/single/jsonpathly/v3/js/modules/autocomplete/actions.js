import { state } from '../../core/state.js';
import { introspectKeys } from './schemaIntrospector.js';

let activeIndex = -1;
let currentSuggestions = [];

export const actions = {
    handleInput: (e) => {
        const input = e.target;
        const val = input.value;
        const dropdown = document.getElementById('autocompleteDropdown');
        if (!dropdown || !state.sourceEditor) return;

        let parsed = null;
        try {
            parsed = JSON.parse(state.sourceEditor.getValue());
        } catch {
            actions.hideDropdown();
            return;
        }

        currentSuggestions = introspectKeys(parsed, val);
        if (currentSuggestions.length === 0) {
            actions.hideDropdown();
            return;
        }

        activeIndex = 0;
        actions.renderDropdown(currentSuggestions);
    },

    handleKeydown: (e) => {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (!dropdown || dropdown.classList.contains('hidden')) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % currentSuggestions.length;
            actions.updateSelectedClass();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
            actions.updateSelectedClass();
        } else if (e.key === 'Tab' || (e.key === 'Enter' && activeIndex >= 0)) {
            if (currentSuggestions[activeIndex]) {
                e.preventDefault();
                actions.selectSuggestion(currentSuggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            actions.hideDropdown();
        }
    },

    renderDropdown: (suggestions = []) => {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (!dropdown) return;

        dropdown.innerHTML = suggestions.map((item, idx) => `
            <div class="autocomplete-item ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" data-key="${item}">
                <i class="bi bi-tag-fill text-sky-400 text-[10px]"></i>
                <span class="font-mono text-xs">${item}</span>
            </div>
        `).join('');

        dropdown.classList.remove('hidden');

        dropdown.querySelectorAll('.autocomplete-item').forEach((el) => {
            el.addEventListener('mousedown', (evt) => {
                evt.preventDefault();
                const key = el.getAttribute('data-key');
                if (key) actions.selectSuggestion(key);
            });
        });
    },

    updateSelectedClass: () => {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (!dropdown) return;
        dropdown.querySelectorAll('.autocomplete-item').forEach((el, idx) => {
            if (idx === activeIndex) el.classList.add('active');
            else el.classList.remove('active');
        });
    },

    selectSuggestion: (key) => {
        const input = document.getElementById('txtQuery');
        if (!input) return;

        let val = input.value;
        if (!val.startsWith('$')) val = '$';

        if (val.endsWith('.')) {
            input.value = val + key;
        } else if (val === '$') {
            input.value = '$.' + key;
        } else {
            const parts = val.split('.');
            parts[parts.length - 1] = key;
            input.value = parts.join('.');
        }

        actions.hideDropdown();
        input.focus();
    },

    hideDropdown: () => {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        activeIndex = -1;
    }
};

export default actions;
