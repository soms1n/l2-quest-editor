const FIELD_NAMES = [
    'tag_?', 'quest_id', 'quest_prog', 'main_name', 'prog_name', 'description',
    'cnt1', 'items[0]', 'items[1]', 'items[2]', 'items[3]', 'items[4]', 'items[5]',
    'items[6]', 'items[7]', 'items[8]', 'items[9]', 'items[10]', 'items[11]',
    'items[12]', 'items[13]', 'cnt2', 'num_items[0]', 'num_items[1]', 'num_items[2]',
    'num_items[3]', 'num_items[4]', 'num_items[5]', 'num_items[6]', 'num_items[7]',
    'num_items[8]', 'num_items[9]', 'num_items[10]', 'num_items[11]', 'num_items[12]',
    'num_items[13]', 'quest_x', 'quest_y', 'quest_z', 'lvl_min', 'lvl_max',
    'quest_type', 'entity_name', 'get_item_in_quest', 'UNK_1', 'UNK_2',
    'contact_npc_id', 'contact_npc_x', 'contact_npc_y', 'contact_npc_z',
    'restricions', 'short_description', 'cnt3',
    ...Array.from({length: 69}, (_, i) => `req_class[${i}]`),
    'cnt4', 'req_item[0]', 'req_item[1]', 'req_item[2]', 'req_item[3]', 'req_item[4]',
    'clan_pet_quest', 'req_quest_complete', 'UNK_3', 'area_id'
];

const FIELD_GROUPS = {
    'Основная информация': ['tag_?', 'quest_id', 'quest_prog', 'main_name', 'prog_name', 'description'],
    'Предметы (items)': ['cnt1', ...Array.from({length: 14}, (_, i) => `items[${i}]`)],
    'Количество предметов (num_items)': ['cnt2', ...Array.from({length: 14}, (_, i) => `num_items[${i}]`)],
    'Координаты квеста': ['quest_x', 'quest_y', 'quest_z'],
    'Требования уровня': ['lvl_min', 'lvl_max'],
    'Параметры квеста': ['quest_type', 'entity_name', 'get_item_in_quest', 'UNK_1', 'UNK_2'],
    'Контактный NPC': ['contact_npc_id', 'contact_npc_x', 'contact_npc_y', 'contact_npc_z'],
    'Описание': ['restricions', 'short_description'],
    'Требуемые классы': ['cnt3', ...Array.from({length: 69}, (_, i) => `req_class[${i}]`)],
    'Требуемые предметы': ['cnt4', ...Array.from({length: 5}, (_, i) => `req_item[${i}]`)],
    'Прочее': ['clan_pet_quest', 'req_quest_complete', 'UNK_3', 'area_id']
};

// Текущие данные
let allRows = []; // Массив всех загруженных строк
let allOriginalRows = []; // Оригинальные данные для отслеживания изменений
let currentRowIndex = -1; // Индекс текущей редактируемой строки
let currentData = {};
let originalData = {};

function getValueType(value, fieldName) {
    if (value === undefined || value === '') {
        return 'empty';
    }
    
    if (value.startsWith && value.startsWith('a,') && value.endsWith('\\0')) {
        return 'string';
    }
    
    if (isCoordinateField(fieldName) && !isNaN(value)) {
        return 'coordinates';
    }
    
    if (!isNaN(value) && String(value).trim() !== '') {
        return 'number';
    }
    
    return 'text';
}

function isCoordinateField(fieldName) {
    return fieldName.endsWith('_x') || fieldName.endsWith('_y') || fieldName.endsWith('_z');
}

function isLongTextField(fieldName) {
    return ['description', 'short_description'].includes(fieldName);
}

function updateField(fieldName, value) {
    currentData[fieldName] = value;
    
    // Обновить данные в массиве
    if (currentRowIndex >= 0 && currentRowIndex < allRows.length) {
        allRows[currentRowIndex] = { ...currentData };
    }
    
    syncToInput();
    
    // Обновить класс модификации
    const input = document.querySelector(`[data-field="${fieldName}"]`);
    if (input) {
        const isModified = currentData[fieldName] !== originalData[fieldName];
        input.classList.toggle('modified', isModified);
        
        // Обновить тип
        const valueType = getValueType(value, fieldName);
        input.className = input.className.replace(/\b(string|number|coordinates|empty|text)\b/g, '');
        input.classList.add('field-input', valueType);
        if (isModified) input.classList.add('modified');
    }
    
    updateStats();
    updateRowsList();
}

function syncToInput() {
    const lines = allRows.map(row => {
        return FIELD_NAMES.map(field => row[field] || '').join('\t');
    });
    document.getElementById('input').value = lines.join('\n');
}

function updateStats() {
    const statsContainer = document.getElementById('stats');
    const totalCount = Object.keys(currentData).length;
    let filledCount = 0;
    let modifiedCount = 0;
    
    for (const field of Object.keys(currentData)) {
        if (currentData[field] !== undefined && currentData[field] !== '') {
            filledCount++;
        }
        if (currentData[field] !== originalData[field]) {
            modifiedCount++;
        }
    }
    
    let statsHtml = `
        <span class="stat-item">Полей: <span class="stat-value">${totalCount}</span></span>
        <span class="stat-item">Заполнено: <span class="stat-value">${filledCount}</span></span>
    `;
    
    if (modifiedCount > 0) {
        statsHtml += `<span class="stat-item" style="color: var(--accent-gold)">Изменено: <span class="stat-value">${modifiedCount}</span></span>`;
    }
    
    statsContainer.innerHTML = statsHtml;
}

function renderResult(data) {
    const resultContainer = document.getElementById('result');
    const statsContainer = document.getElementById('stats');
    
    if (!data || Object.keys(data).length === 0) {
        resultContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p>Введите данные квестов в левую панель</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Каждый квест на новой строке, поля разделяются табуляцией</p>
            </div>
        `;
        statsContainer.innerHTML = '';
        return;
    }

    let html = '';

    for (const [groupName, fields] of Object.entries(FIELD_GROUPS)) {
        const groupFields = fields.filter(field => data.hasOwnProperty(field));
        if (groupFields.length === 0) continue;

        // Для массивов items показываем компактно
        if (groupName === 'Предметы (items)') {
            const cnt1Value = data['cnt1'] || '';
            const cnt1Type = getValueType(cnt1Value, 'cnt1');
            
            html += `<div class="field-group">
                <div class="field-group-title">${groupName}</div>
                <div class="field-row">
                    <span class="field-name">cnt1</span>
                    <input type="text" 
                        class="field-input ${cnt1Type}" 
                        data-field="cnt1" 
                        value="${escapeAttr(cnt1Value)}"
                        oninput="updateField('cnt1', this.value)">
                </div>
                <div class="array-container">
                    <div class="array-title">items[0..13]</div>
                    <div class="array-grid">
                        ${Array.from({length: 14}, (_, index) => {
                            const fieldName = `items[${index}]`;
                            const value = data[fieldName] || '';
                            const isEmpty = value === '';
                            return `<div class="array-item-wrapper">
                                <span class="array-item-label">[${index}]</span>
                                <input type="text" 
                                    class="array-item-input ${isEmpty ? 'empty' : ''}" 
                                    data-field="${fieldName}"
                                    value="${escapeAttr(value)}"
                                    oninput="updateField('${fieldName}', this.value)">
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
            continue;
        }

        // Для массивов num_items показываем компактно
        if (groupName === 'Количество предметов (num_items)') {
            const cnt2Value = data['cnt2'] || '';
            const cnt2Type = getValueType(cnt2Value, 'cnt2');
            
            html += `<div class="field-group">
                <div class="field-group-title">${groupName}</div>
                <div class="field-row">
                    <span class="field-name">cnt2</span>
                    <input type="text" 
                        class="field-input ${cnt2Type}" 
                        data-field="cnt2" 
                        value="${escapeAttr(cnt2Value)}"
                        oninput="updateField('cnt2', this.value)">
                </div>
                <div class="array-container">
                    <div class="array-title">num_items[0..13]</div>
                    <div class="array-grid">
                        ${Array.from({length: 14}, (_, index) => {
                            const fieldName = `num_items[${index}]`;
                            const value = data[fieldName] || '';
                            const isEmpty = value === '';
                            return `<div class="array-item-wrapper">
                                <span class="array-item-label">[${index}]</span>
                                <input type="text" 
                                    class="array-item-input ${isEmpty ? 'empty' : ''}" 
                                    data-field="${fieldName}"
                                    value="${escapeAttr(value)}"
                                    oninput="updateField('${fieldName}', this.value)">
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
            continue;
        }

        // Для массивов req_class показываем компактно
        if (groupName === 'Требуемые классы') {
            const cnt3Value = data['cnt3'] || '';
            const cnt3Type = getValueType(cnt3Value, 'cnt3');
            
            html += `<div class="field-group">
                <div class="field-group-title">${groupName}</div>
                <div class="field-row">
                    <span class="field-name">cnt3</span>
                    <input type="text" 
                        class="field-input ${cnt3Type}" 
                        data-field="cnt3" 
                        value="${escapeAttr(cnt3Value)}"
                        oninput="updateField('cnt3', this.value)">
                </div>
                <div class="array-container">
                    <div class="array-title">req_class[0..68]</div>
                    <div class="array-grid">
                        ${Array.from({length: 69}, (_, index) => {
                            const fieldName = `req_class[${index}]`;
                            const value = data[fieldName] || '';
                            const isEmpty = value === '';
                            return `<div class="array-item-wrapper">
                                <span class="array-item-label">[${index}]</span>
                                <input type="text" 
                                    class="array-item-input ${isEmpty ? 'empty' : ''}" 
                                    data-field="${fieldName}"
                                    value="${escapeAttr(value)}"
                                    oninput="updateField('${fieldName}', this.value)">
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
            continue;
        }

        // Для массивов req_item показываем компактно
        if (groupName === 'Требуемые предметы') {
            const cnt4Value = data['cnt4'] || '';
            const cnt4Type = getValueType(cnt4Value, 'cnt4');
            
            html += `<div class="field-group">
                <div class="field-group-title">${groupName}</div>
                <div class="field-row">
                    <span class="field-name">cnt4</span>
                    <input type="text" 
                        class="field-input ${cnt4Type}" 
                        data-field="cnt4" 
                        value="${escapeAttr(cnt4Value)}"
                        oninput="updateField('cnt4', this.value)">
                </div>
                <div class="array-container">
                    <div class="array-title">req_item[0..4]</div>
                    <div class="array-grid">
                        ${Array.from({length: 5}, (_, index) => {
                            const fieldName = `req_item[${index}]`;
                            const value = data[fieldName] || '';
                            const isEmpty = value === '';
                            return `<div class="array-item-wrapper">
                                <span class="array-item-label">[${index}]</span>
                                <input type="text" 
                                    class="array-item-input ${isEmpty ? 'empty' : ''}" 
                                    data-field="${fieldName}"
                                    value="${escapeAttr(value)}"
                                    oninput="updateField('${fieldName}', this.value)">
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
            continue;
        }

        html += `<div class="field-group">
            <div class="field-group-title">${groupName}</div>`;

        // Специальная обработка для inline полей (tag_?, quest_id, quest_prog)
        const inlineFields = ['tag_?', 'quest_id', 'quest_prog'];
        // Координатные и уровневые поля для отображения в одну строку
        const coordinateFields = ['quest_x', 'quest_y', 'quest_z', 'contact_npc_x', 'contact_npc_y', 'contact_npc_z', 'lvl_min', 'lvl_max'];
        // Поля типа квеста для отображения в одну строку
        const questTypeFields = ['quest_type', 'entity_name'];
        // Поля get_item_in_quest, UNK_1, UNK_2 в одну строку
        const questItemFields = ['get_item_in_quest', 'UNK_1', 'UNK_2'];
        const inlineGroupFields = groupFields.filter(field => inlineFields.includes(field));
        const coordGroupFields = groupFields.filter(field => coordinateFields.includes(field));
        const questTypeGroupFields = groupFields.filter(field => questTypeFields.includes(field));
        const questItemGroupFields = groupFields.filter(field => questItemFields.includes(field));
        const regularGroupFields = groupFields.filter(field => !inlineFields.includes(field) && !coordinateFields.includes(field) && !questTypeFields.includes(field) && !questItemFields.includes(field));

        // Рендерим inline поля в одну строку
        if (inlineGroupFields.length > 0) {
            html += `<div class="field-row-inline">`;
            for (const field of inlineGroupFields) {
                const value = data[field] || '';
                const valueType = getValueType(value, field);
                html += `<div class="inline-field">
                    <span class="field-name">${field}</span>
                    <input type="text" 
                        class="field-input ${valueType}" 
                        data-field="${field}" 
                        value="${escapeAttr(value)}"
                        oninput="updateField('${escapeAttr(field)}', this.value)">
                </div>`;
            }
            html += `</div>`;
        }

        // Рендерим координатные поля в одну строку
        if (coordGroupFields.length > 0) {
            html += `<div class="field-row-inline">`;
            for (const field of coordGroupFields) {
                const value = data[field] || '';
                const valueType = getValueType(value, field);
                html += `<div class="inline-field">
                    <span class="field-name">${field}</span>
                    <input type="text" 
                        class="field-input ${valueType}" 
                        data-field="${field}" 
                        value="${escapeAttr(value)}"
                        oninput="updateField('${escapeAttr(field)}', this.value)">
                </div>`;
            }
            html += `</div>`;
        }

        // Рендерим поля типа квеста в одну строку
        if (questTypeGroupFields.length > 0) {
            html += `<div class="field-row-inline">`;
            for (const field of questTypeGroupFields) {
                const value = data[field] || '';
                const valueType = getValueType(value, field);
                html += `<div class="inline-field">
                    <span class="field-name">${field}</span>
                    <input type="text" 
                        class="field-input ${valueType}" 
                        data-field="${field}" 
                        value="${escapeAttr(value)}"
                        oninput="updateField('${escapeAttr(field)}', this.value)">
                </div>`;
            }
            html += `</div>`;
        }

        // Рендерим поля get_item_in_quest, UNK_1, UNK_2 в одну строку
        if (questItemGroupFields.length > 0) {
            html += `<div class="field-row-inline">`;
            for (const field of questItemGroupFields) {
                const value = data[field] || '';
                const valueType = getValueType(value, field);
                html += `<div class="inline-field">
                    <span class="field-name">${field}</span>
                    <input type="text" 
                        class="field-input ${valueType}" 
                        data-field="${field}" 
                        value="${escapeAttr(value)}"
                        oninput="updateField('${escapeAttr(field)}', this.value)">
                </div>`;
            }
            html += `</div>`;
        }

        // Рендерим остальные поля как обычно
        for (const field of regularGroupFields) {
            const value = data[field] || '';
            const valueType = getValueType(value, field);
            const isLong = isLongTextField(field);
            
            if (isLong) {
                html += `<div class="field-row">
                    <span class="field-name">${field}</span>
                    <textarea 
                        class="field-input ${valueType}" 
                        data-field="${field}"
                        oninput="updateField('${escapeAttr(field)}', this.value)"
                    >${escapeHtml(value)}</textarea>
                </div>`;
            } else {
                html += `<div class="field-row">
                    <span class="field-name">${field}</span>
                    <input type="text" 
                        class="field-input ${valueType}" 
                        data-field="${field}" 
                        value="${escapeAttr(value)}"
                        oninput="updateField('${escapeAttr(field)}', this.value)">
                </div>`;
            }
        }

        html += '</div>';
    }

    resultContainer.innerHTML = html;
    updateStats();
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function escapeAttr(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseSingleRow(line) {
    if (!line.trim()) {
        return null;
    }
    
    const values = line.split('\t');
    const data = {};
    
    for (let index = 0; index < FIELD_NAMES.length && index < values.length; index++) {
        data[FIELD_NAMES[index]] = values[index];
    }
    
    return data;
}

function parseInput(input) {
    if (!input.trim()) {
        return [];
    }
    
    const lines = input.split('\n').filter(line => line.trim() !== '');
    const rows = [];
    
    for (const line of lines) {
        const rowData = parseSingleRow(line);
        if (rowData) {
            rows.push(rowData);
        }
    }
    
    return rows;
}

function clearInput() {
    document.getElementById('input').value = '';
    allRows = [];
    allOriginalRows = [];
    currentRowIndex = -1;
    currentData = {};
    originalData = {};
    renderResult(null);
    updateRowsList();
}

function createEmptyQuest() {
    const emptyQuest = {};
    for (const fieldName of FIELD_NAMES) {
        emptyQuest[fieldName] = '';
    }
    return emptyQuest;
}

function addNewQuest() {
    const newQuest = createEmptyQuest();
    
    // Генерируем временный quest_id для нового квеста
    const nextQuestId = allRows.length + 1;
    newQuest['quest_id'] = String(nextQuestId);
    newQuest['main_name'] = 'a,Новый квест\\0';
    
    allRows.push(newQuest);
    allOriginalRows.push(createEmptyQuest()); // Оригинал пустой - всё будет "изменено"
    
    // Переключаемся на новый квест
    currentRowIndex = allRows.length - 1;
    currentData = { ...newQuest };
    originalData = { ...allOriginalRows[currentRowIndex] };
    
    syncToInput();
    renderResult(currentData);
    updateRowsList();
    
    showToast('Новый квест добавлен!');
}

function deleteCurrentQuest() {
    if (currentRowIndex < 0 || currentRowIndex >= allRows.length) {
        showToast('Нет квеста для удаления');
        return;
    }
    
    const questName = getRowDisplayName(allRows[currentRowIndex], currentRowIndex);
    
    // Удаляем квест из массивов
    allRows.splice(currentRowIndex, 1);
    allOriginalRows.splice(currentRowIndex, 1);
    
    // Обновляем индекс текущей строки
    if (allRows.length === 0) {
        currentRowIndex = -1;
        currentData = {};
        originalData = {};
        renderResult(null);
    } else {
        // Если удалили последний - выбираем предыдущий
        if (currentRowIndex >= allRows.length) {
            currentRowIndex = allRows.length - 1;
        }
        currentData = { ...allRows[currentRowIndex] };
        originalData = { ...allOriginalRows[currentRowIndex] };
        renderResult(currentData);
    }
    
    syncToInput();
    updateRowsList();
    
    showToast(`Квест ${questName} удалён`);
}

function selectRow(index) {
    if (index < 0 || index >= allRows.length) return;
    
    currentRowIndex = index;
    currentData = { ...allRows[index] };
    originalData = { ...allOriginalRows[index] };
    
    renderResult(currentData);
    updateRowsList();
}

function getRowDisplayName(rowData, index) {
    const questId = rowData['quest_id'] || '';
    const mainName = rowData['main_name'] || '';
    
    let displayName = `#${index + 1}`;
    
    if (questId) {
        displayName += ` [${questId}]`;
    }
    
    if (mainName) {
        // Удаляем a, и \0 из строки для отображения
        let cleanName = mainName;
        if (cleanName.startsWith('a,')) {
            cleanName = cleanName.substring(2);
        }
        if (cleanName.endsWith('\\0')) {
            cleanName = cleanName.slice(0, -2);
        }
        if (cleanName.length > 30) {
            cleanName = cleanName.substring(0, 30) + '...';
        }
        displayName += ` ${cleanName}`;
    }
    
    return displayName;
}

function isRowModified(index) {
    if (index < 0 || index >= allRows.length) return false;
    const row = allRows[index];
    const originalRow = allOriginalRows[index];
    
    for (const field of FIELD_NAMES) {
        if ((row[field] || '') !== (originalRow[field] || '')) {
            return true;
        }
    }
    return false;
}

function updateRowsList() {
    const navigator = document.getElementById('rowsNavigator');
    const rowsList = document.getElementById('rowsList');
    const rowsCount = document.getElementById('rowsCount');
    const deleteBtn = document.getElementById('deleteQuestBtn');
    
    if (allRows.length === 0) {
        navigator.style.display = 'none';
        deleteBtn.style.display = 'none';
        return;
    }
    
    navigator.style.display = 'block';
    rowsCount.textContent = `(${allRows.length})`;
    deleteBtn.style.display = currentRowIndex >= 0 ? 'flex' : 'none';
    
    let html = '';
    for (let index = 0; index < allRows.length; index++) {
        const row = allRows[index];
        const isActive = index === currentRowIndex;
        const isModified = isRowModified(index);
        const displayName = getRowDisplayName(row, index);
        
        html += `<div class="row-item ${isActive ? 'active' : ''} ${isModified ? 'modified' : ''}" 
                      onclick="selectRow(${index})">
            <span class="row-item-name">${escapeHtml(displayName)}</span>
            ${isModified ? '<span class="row-item-badge">изменён</span>' : ''}
        </div>`;
    }
    
    rowsList.innerHTML = html;
}

function copyResult() {
    if (allRows.length === 0) {
        showToast('Нет данных для копирования');
        return;
    }
    
    const lines = allRows.map(row => {
        return FIELD_NAMES.map(field => row[field] || '').join('\t');
    });
    const result = lines.join('\n');
    
    navigator.clipboard.writeText(result).then(() => {
        showToast(`Скопировано ${allRows.length} строк(и) в буфер обмена!`);
    }).catch(() => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = result;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`Скопировано ${allRows.length} строк(и) в буфер обмена!`);
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function handleInputChange(inputValue) {
    const rows = parseInput(inputValue);
    
    allRows = rows;
    allOriginalRows = rows.map(row => ({ ...row }));
    
    if (rows.length > 0) {
        currentRowIndex = 0;
        currentData = { ...rows[0] };
        originalData = { ...allOriginalRows[0] };
        renderResult(currentData);
    } else {
        currentRowIndex = -1;
        currentData = {};
        originalData = {};
        renderResult(null);
    }
    
    updateRowsList();
}

// Инициализация обработчиков событий при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    const inputElement = document.getElementById('input');
    
    // Обработка ввода в левой панели
    inputElement.addEventListener('input', function(event) {
        handleInputChange(event.target.value);
    });

    // Обработка вставки
    inputElement.addEventListener('paste', function() {
        setTimeout(() => {
            handleInputChange(this.value);
        }, 0);
    });
});

