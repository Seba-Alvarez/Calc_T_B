// Lógica principal: calcula la tabla de verdad
function calculateTruthTable() {
    const container = document.getElementById('truth-table');
    container.innerHTML = '';
  
    const inputs = document.querySelectorAll('.expression-input');
    const formulas = [...inputs].map(i => i.value).filter(v => v);
  
    if (formulas.length === 0) return;
  
    const variables = Array.from(new Set(formulas.join('').match(/[a-z]/g))).sort();
  
    const combinations = 1 << variables.length;
    const rows = [];
  
    for (let i = 0; i < combinations; i++) {
      const context = {};
      variables.forEach((v, idx) => {
        context[v] = Boolean((i >> (variables.length - idx - 1)) & 1);
      });
  
      const row = variables.map(v => context[v] ? 'V' : 'F');
  
      for (const expr of formulas) {
        try {
          const result = evaluateLogicalExpression(expr, context);
          row.push(result ? 'V' : 'F');
        } catch (e) {
          row.push('Error');
        }
      }
  
      rows.push(row);
    }
  
    // Crear la tabla HTML
    const table = document.createElement('table');
    const header = document.createElement('tr');
    [...variables, ...formulas].forEach(h => {
      const th = document.createElement('th');
      th.innerText = h;
      header.appendChild(th);
    });
    table.appendChild(header);
  
    rows.forEach(r => {
      const tr = document.createElement('tr');
      r.forEach(val => {
        const td = document.createElement('td');
        td.innerText = val;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
  
    container.appendChild(table);
  }
  
  // Evalúa una fórmula lógica con contexto (valores de las variables)
  function evaluateLogicalExpression(expr, context) {
    const tokens = tokenize(expr.replace(/\s+/g, ''));
    const ast = parseExpression(tokens);
    return evaluateAST(ast, context);
  }
  
  // Tokeniza la fórmula en símbolos lógicos
  function tokenize(expr) {
    const symbols = ['¬', '∧', '∨', '→', '↔', '⊕', '(', ')'];
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      const char = expr[i];
      if (symbols.includes(char)) {
        tokens.push(char);
        i++;
      } else if (/[a-z]/.test(char)) {
        tokens.push(char);
        i++;
      } else {
        throw new Error(`Símbolo no reconocido: ${char}`);
      }
    }
    return tokens;
  }
  
  // Parser: construye el árbol sintáctico de la fórmula
  function parseExpression(tokens) {
    let index = 0;
  
    function parsePrimary() {
      const token = tokens[index++];
      if (token === '(') {
        const expr = parseBinary();
        if (tokens[index++] !== ')') throw new Error("Falta ')'");
        return expr;
      }
      if (token === '¬') {
        return { type: 'not', value: parsePrimary() };
      }
      if (/[a-z]/.test(token)) {
        return { type: 'var', name: token };
      }
      if (token === '⊤') {
        return { type: 'const', value: true };
      }
      if (token === '⊥') {
        return { type: 'const', value: false };
      }
      throw new Error(`Token inesperado: ${token}`);
    }
  
    function getPrecedence(op) {
      return {
        '¬': 4,
        '∧': 3,
        '∨': 2,
        '⊕': 2,
        '→': 1,
        '↔': 0
      }[op] ?? -1;
    }
  
    function parseBinary(precedence = 0) {
      let left = parsePrimary();
      while (index < tokens.length) {
        const op = tokens[index];
        const opPrec = getPrecedence(op);
        if (opPrec < precedence) break;
  
        index++;
        let right = parseBinary(opPrec + 1);
        left = { type: 'binary', op, left, right };
      }
      return left;
    }
  
    return parseBinary();
  }
  
  // Evalúa el árbol sintáctico con los valores de contexto
  function evaluateAST(node, context) {
    switch (node.type) {
      case 'var':
        return context[node.name];
      case 'const':
        return node.value;
      case 'not':
        return !evaluateAST(node.value, context);
      case 'binary':
        const a = evaluateAST(node.left, context);
        const b = evaluateAST(node.right, context);
        switch (node.op) {
          case '∧': return a && b;
          case '∨': return a || b;
          case '⊕': return a !== b;
          case '→': return !a || b;
          case '↔': return a === b;
          default:
            throw new Error(`Operador desconocido: ${node.op}`);
        }
    }
  }
  
  // Funciones de interacción con la UI
  
  function addSymbol(symbol) {
    let activeInput = document.querySelector('.expression-input:focus');
  
    if (!activeInput) {
      const inputs = document.querySelectorAll('.expression-input');
      if (inputs.length > 0) {
        activeInput = inputs[inputs.length - 1];
        activeInput.focus();
      }
    }
  
    if (activeInput) {
      const cursorPos = activeInput.selectionStart ?? activeInput.value.length;
      const value = activeInput.value;
      activeInput.value = value.slice(0, cursorPos) + symbol + value.slice(cursorPos);
      activeInput.selectionStart = activeInput.selectionEnd = cursorPos + symbol.length;
    }
  }
  
  function addExpressionColumn() {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'expression-column';
  
    const input = document.createElement('input');
    input.className = 'expression-input';
    input.placeholder = 'Expresión';
  
    const deleteBtn = document.createElement('span');
    deleteBtn.innerText = 'Borrar';
    deleteBtn.className = 'delete-button';
    deleteBtn.onclick = () => columnDiv.remove();
  
    columnDiv.appendChild(input);
    columnDiv.appendChild(deleteBtn);
  
    document.getElementById('expressions').appendChild(columnDiv);
  }
  
  function clearTruthTable() {
    const container = document.getElementById('truth-table');
    container.innerHTML = '';
  }

  //botón lateral
  const toggleButton = document.getElementById('toggle-panel');
  const sidePanel = document.getElementById('side-panel');

  toggleButton.addEventListener('click', () => {
    sidePanel.classList.toggle('active');
    toggleButton.innerHTML = sidePanel.classList.contains('active') ? '&#x25C0;' : '&#x25B6;';
  });
  
let intro;
let tutorialCompleted = false;
let currentSymbolIndex = 0;
const symbolSteps = ['p', '→', '¬', 'q'];

const steps = [
  {
    element: '.action-button[onclick="addExpressionColumn()"]',
    intro: "Primero, apretar 'Agregar Proposición'.",
    action: () => {
      disableAllButtons(true);
      document.querySelector('.action-button[onclick="addExpressionColumn()"]').disabled = false;
      document.getElementById('toggle-panel').disabled = false;

      const addBtn = document.querySelector('.action-button[onclick="addExpressionColumn()"]');
      addBtn.onclick = () => {
        addExpressionColumn();
        intro.nextStep();
      };
    }
  },
  {
    element: '#logic-buttons',
    intro: "Ahora el botón 'p'.",
    allowedSymbol: 'p',
    action: () => {
      enableSingleSymbol('p', () => {
        intro.nextStep();
      });
    }
  },
  {
    element: '#logic-buttons',
    intro: "Ahora el botón '→'.",
    allowedSymbol: '→',
    action: () => {
      enableSingleSymbol('→', () => {
        intro.nextStep();
      });
    }
  },
  {
    element: '#logic-buttons',
    intro: "Ahora el botón '¬'.",
    allowedSymbol: '¬',
    action: () => {
      enableSingleSymbol('¬', () => {
        intro.nextStep();
      });
    }
  },
  {
    element: '#logic-buttons',
    intro: "Finalmente el botón 'q'.",
    allowedSymbol: 'q',
    action: () => {
      enableSingleSymbol('q', () => {
        intro.nextStep();
      });
    }
  },
  {
    element: '.action-button[onclick="calculateTruthTable()"]',
    intro: "Ahora 'Calcular Proposición'.",
    action: () => {
      disableAllButtons(true);
      const calcBtn = document.querySelector('.action-button[onclick="calculateTruthTable()"]');
      calcBtn.disabled = false;
      calcBtn.onclick = () => {
        calculateTruthTable();
        tutorialCompleted = true;
        intro.nextStep();
      };
    }
  },
  {
    element: '#truth-table',
    intro: "Esta es la tabla de verdad resultante.",
    action: () => {
      disableAllButtons(false);
    }
  }
];

function startExampleTutorial() {
  resetTutorial();

  tutorialCompleted = false;
  intro = introJs();
  intro.setOptions({
    steps: steps,
    showStepNumbers: false,
    showButtons: false,
    exitOnOverlayClick: false,
    exitOnEsc: false,
    disableInteraction: false,
    doneLabel: 'Finalizar'
  });

  intro.onbeforechange(function () {
    const step = this._currentStep;
    if (steps[step].action) steps[step].action();
  });

  intro.onexit(() => {
    if (!tutorialCompleted) {
      if (confirm("¿Estás seguro de que querés salir del tutorial antes de terminarlo?")) {
        disableAllButtons(false);
      } else {
        intro.start(); // Reinicia si cancela
      }
    } else {
      disableAllButtons(false);
    }
  });

  intro.oncomplete(() => {
    tutorialCompleted = true;
    disableAllButtons(false);
  });

  intro.start();
}

function resetTutorial() {
  clearTruthTable();
  document.getElementById('expressions').innerHTML = '';
  currentSymbolIndex = 0;
}

function disableAllButtons(disabled) {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    if (btn.textContent !== '¿Cómo funciona?' && btn.textContent !== 'Ejemplo') {
      btn.disabled = disabled;
    }
  });
}

function enableSingleSymbol(symbol, callback) {
  disableAllButtons(true);
  const buttons = document.querySelectorAll('#logic-buttons button');

  buttons.forEach(btn => {
    if (btn.textContent === symbol) {
      btn.disabled = false;
      btn.onclick = () => {
        addSymbol(symbol);
        callback(); // Avanza al siguiente paso
      };
    } else {
      btn.disabled = true;
    }
  });
}
