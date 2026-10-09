import {actions, defaults, groups, mouseValues, typesForAction, wheelValues} from './mapping.js';
import {exportableKeys} from './keys.js';
import {captureKey} from './capture.js';
import {parseIni, serialize, validate} from './validation.js';

const byId = id => document.getElementById(id);
let entries = [];
let savedConfiguration = '[]';
let captureTarget;
let captureButton;
let selectedGroup = groups[0].name;
const dialog = byId('capture-dialog');

function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
}

function isDirty() {
    return JSON.stringify(entries) !== savedConfiguration;
}

async function confirmReplacement() {
    if (!isDirty()) return true;
    const confirmation = byId('replace-dialog');
    confirmation.returnValue = 'cancel';
    return new Promise(resolve => {
        confirmation.addEventListener('close', () => resolve(confirmation.returnValue === 'discard'), {once: true});
        confirmation.showModal();
    });
}

function valueChoices(type) {
    return type === 'KEY' ? exportableKeys : type === 'MOUSE' ? mouseValues : type === 'WHEEL' ? wheelValues : [];
}

function selectControl(label, choices, value) {
    const select = element('select');
    select.setAttribute('aria-label', label);
    const empty = element('option', 'Select…');
    empty.value = '';
    select.append(empty);
    for (const choice of choices) {
        const option = element('option', choice);
        option.value = choice;
        select.append(option);
    }
    select.value = value;
    return select;
}

function button(text, label, click) {
    const control = element('button', text);
    control.type = 'button';
    control.setAttribute('aria-label', label);
    control.addEventListener('click', click);
    return control;
}

function renderCategories() {
    const labels = ['Face buttons', 'Shoulders', 'D-pad', 'Left stick', 'Right stick', 'Touch & utility'];
    const icons = ['face-icon', 'shoulder-icon', 'direction-icon', 'stick-icon', 'stick-icon', 'touch-icon'];
    const symbols = ['△ ○ × □', 'L2 R2', '', 'L', 'R', ''];
    groups.forEach((group, index) => {
        const category = button('', group.name, () => {
            selectedGroup = group.name;
            byId('search').value = '';
            filterActions();
        });
        category.className = 'category';
        category.dataset.group = group.name;
        const icon = element('span', undefined, 'category-icon');
        icon.setAttribute('aria-hidden', 'true');
        const mark = element('span', undefined, icons[index]);
        if (index === 0) {
            for (const symbol of symbols[index].split(' ')) mark.append(element('span', symbol));
        } else mark.textContent = symbols[index];
        icon.append(mark);
        category.append(icon, element('span', labels[index], 'category-label'));
        category.addEventListener('keydown', event => {
            const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!offset && event.key !== 'Home' && event.key !== 'End') return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : (index + offset + groups.length) % groups.length;
            const target = byId('categories').children[next];
            target.click();
            target.focus();
            target.scrollIntoView({block: 'nearest', inline: 'nearest'});
        });
        byId('categories').append(category);
    });
}

function renderBinding(entry, position) {
    const row = element('div', undefined, 'binding');
    const label = `${entry.action} binding ${position + 1}`;
    const type = selectControl(`${label} input type`, typesForAction(entry.action), entry.type);
    const value = selectControl(`${label} input value`, valueChoices(entry.type), entry.value);
    const capture = button('Capture', `Capture key for ${label}`, () => {
        captureTarget = entry;
        captureButton = capture;
        byId('capture-title').textContent = `Press a key for ${entry.action}`;
        byId('capture-status').textContent = '';
        dialog.showModal();
    });
    capture.disabled = entry.type !== 'KEY';
    const remove = button('Remove', `Remove ${label}`, () => {
        entries = entries.filter(binding => binding !== entry);
        render();
        const remaining = document.querySelector(`[data-action="${entry.action}"] .binding select`);
        (remaining || document.querySelector(`[data-action="${entry.action}"] .add-binding`)).focus();
    });
    type.addEventListener('change', () => {
        entry.type = type.value;
        entry.value = '';
        value.replaceChildren(element('option', 'Select…'));
        value.firstChild.value = '';
        for (const choice of valueChoices(entry.type)) {
            const option = element('option', choice);
            option.value = choice;
            value.append(option);
        }
        capture.disabled = entry.type !== 'KEY';
        updateOutput();
    });
    value.addEventListener('change', () => {
        entry.value = value.value;
        updateOutput();
    });
    row.append(type, value, capture, remove);
    return row;
}

function render() {
    const container = byId('mappings');
    container.replaceChildren();
    for (const group of groups) {
        const section = element('section', undefined, 'group');
        section.dataset.group = group.name;
        section.append(element('h2', group.name));
        for (const action of group.actions) {
            const article = element('div', undefined, 'action');
            article.dataset.action = action;
            const heading = element('div', undefined, 'action-heading');
            const add = button('+ Add binding', `Add binding to ${action}`, () => {
                entries.push({action, type: 'KEY', value: ''});
                render();
                const rows = document.querySelectorAll(`[data-action="${action}"] .binding`);
                rows[rows.length - 1].querySelectorAll('select')[1].focus();
            });
            add.className = 'add-binding';
            const title = element('div', undefined, 'action-title');
            const symbols = {Cross: '×', Circle: '○', Triangle: '△', Square: '□', Up: '↑', Right: '→', Down: '↓', Left: '←'};
            if (symbols[action]) {
                const symbol = element('span', symbols[action], 'action-symbol');
                symbol.setAttribute('aria-hidden', 'true');
                title.append(symbol);
            }
            title.append(element('h3', action));
            heading.append(title, add);
            article.append(heading);
            const configured = entries.filter(entry => entry.action === action);
            article.append(element('p', configured.length ? 'Custom inputs replace built-in inputs.' : `Built-in: ${defaults[action].join(', ') || 'no keyboard or mouse binding'}`, 'hint'));
            configured.forEach((entry, position) => article.append(renderBinding(entry, position)));
            section.append(article);
        }
        container.append(section);
    }
    filterActions();
    updateOutput();
}

function filterActions() {
    const search = byId('search').value.trim().toLowerCase();
    byId('group-title').textContent = search ? 'Search results' : selectedGroup;
    for (const category of byId('categories').children) {
        category.setAttribute('aria-pressed', String(!search && category.dataset.group === selectedGroup));
    }
    let visible = 0;
    for (const section of document.querySelectorAll('.group')) {
        let matches = 0;
        for (const action of section.querySelectorAll('.action')) {
            action.hidden = search ? !`${section.dataset.group} ${action.dataset.action}`.toLowerCase().includes(search) : section.dataset.group !== selectedGroup;
            if (!action.hidden) matches++;
        }
        section.hidden = matches === 0;
        visible += matches;
    }
    let empty = byId('no-results');
    if (!empty) {
        empty = element('p', 'No actions match your search.', 'hint');
        empty.id = 'no-results';
        byId('mappings').append(empty);
    }
    empty.hidden = visible !== 0;
}

function updateOutput() {
    const result = validate(entries);
    const valid = result.errors.length === 0;
    byId('preview').value = valid ? serialize(entries) : '';
    byId('count').textContent = `${new Set(result.bindings.map(binding => binding.action)).size} / ${actions.length} actions`;
    byId('download').disabled = !valid;
    byId('copy').disabled = !valid;
    const report = byId('validation');
    report.replaceChildren();
    for (const [name, messages] of [['error', result.errors], ['warning', result.warnings]]) {
        if (!messages.length) continue;
        const list = element('ul', undefined, name);
        for (const item of messages) list.append(element('li', item.message));
        report.append(list);
    }
    const rows = [...document.querySelectorAll('.binding')];
    const renderedEntries = groups.flatMap(group => group.actions.flatMap(action => entries.filter(entry => entry.action === action)));
    rows.forEach((row, index) => {
        const invalid = result.errors.some(error => entries[error.index] === renderedEntries[index]);
        for (const select of row.querySelectorAll('select')) select.setAttribute('aria-invalid', String(invalid));
    });
}

function cancelCapture(message) {
    captureTarget = undefined;
    dialog.close();
    captureButton?.focus();
    if (message) byId('status').textContent = message;
}

byId('cancel-capture').addEventListener('click', () => cancelCapture('Capture cancelled.'));
dialog.addEventListener('cancel', event => {
    event.preventDefault();
    cancelCapture('Capture cancelled.');
});
window.addEventListener('blur', () => {
    if (captureTarget) cancelCapture('Capture cancelled because the window lost focus.');
});
window.addEventListener('keydown', event => {
    if (!captureTarget) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.code === 'Escape' || event.key === 'Escape') {
        cancelCapture('Capture cancelled.');
        return;
    }
    if (event.repeat) return;
    const result = captureKey(event);
    if (result.error) {
        byId('capture-status').textContent = result.error;
        return;
    }
    const target = captureTarget;
    target.value = result.value;
    cancelCapture();
    const article = document.querySelector(`[data-action="${target.action}"]`);
    const position = entries.filter(entry => entry.action === target.action).indexOf(target);
    article.querySelectorAll('.binding')[position].querySelectorAll('select')[1].value = result.value;
    updateOutput();
    byId('status').textContent = `Captured ${result.value} for ${target.action}.`;
}, true);

byId('search').addEventListener('input', filterActions);
byId('reset').addEventListener('click', async () => {
    if (!await confirmReplacement()) return;
    entries = [];
    savedConfiguration = '[]';
    byId('import-report').hidden = true;
    render();
    byId('status').textContent = 'Configuration reset. All actions use built-in inputs.';
});
byId('import').addEventListener('click', () => byId('file').click());
byId('file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    try {
        if (file.size > 1024 * 1024) throw new Error('INI file must be smaller than 1 MiB.');
        const text = new TextDecoder('utf-8', {fatal: true}).decode(await file.arrayBuffer());
        const result = parseIni(text);
        const report = byId('import-report');
        report.replaceChildren(element('h2', result.errors.length ? 'Import rejected' : 'Import read successfully'));
        const messages = [...result.errors, ...result.warnings];
        if (messages.length) {
            const list = element('ul');
            for (const item of messages) list.append(element('li', `Line ${item.line}: ${item.message}`));
            report.append(list);
        }
        report.hidden = false;
        if (result.errors.length) {
            report.append(element('p', 'Your current configuration has been preserved.', 'error'));
            report.focus();
            return;
        }
        if (!await confirmReplacement()) return;
        entries = result.entries;
        savedConfiguration = JSON.stringify(entries);
        render();
        byId('status').textContent = `Imported ${file.name}.`;
    } catch (error) {
        byId('status').textContent = `Import failed: ${error.message}`;
    }
});
byId('download').addEventListener('click', () => {
    const content = serialize(entries);
    const url = URL.createObjectURL(new Blob([content], {type: 'text/plain;charset=utf-8'}));
    const link = element('a');
    link.href = url;
    link.download = 'anyps5-input.ini';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    savedConfiguration = JSON.stringify(entries);
    byId('status').textContent = 'Configuration download requested.';
});
byId('copy').addEventListener('click', async () => {
    try {
        const content = serialize(entries);
        const copiedConfiguration = JSON.stringify(entries);
        await navigator.clipboard.writeText(content);
        savedConfiguration = copiedConfiguration;
        byId('status').textContent = 'Configuration copied.';
    } catch {
        byId('preview').focus();
        byId('preview').select();
        byId('status').textContent = 'Clipboard unavailable. Copy the selected preview with Ctrl+C.';
    }
});
window.addEventListener('beforeunload', event => {
    if (!isDirty()) return;
    event.preventDefault();
    event.returnValue = '';
});
byId('focus-search').addEventListener('click', () => byId('search').focus());
function updateClock() {
    const now = new Date();
    byId('clock').textContent = new Intl.DateTimeFormat('en-GB', {hour: '2-digit', minute: '2-digit'}).format(now);
    byId('clock').dateTime = now.toISOString();
}
updateClock();
setInterval(updateClock, 60000);
renderCategories();
render();
