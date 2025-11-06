/**
 * Système de coloration syntaxique simple mais efficace
 * Support pour les langages les plus courants
 */

interface Token {
  type: string;
  content: string;
}

export function highlightCode(code: string, language: string): string {
  const tokens = tokenize(code, language);
  return tokens
    .map((token) => {
      if (token.type === 'text') {
        return escapeHtml(token.content);
      }
      return `<span class="token ${token.type}">${escapeHtml(token.content)}</span>`;
    })
    .join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function tokenize(code: string, language: string): Token[] {
  const lang = language.toLowerCase();

  // Sélectionner le bon tokenizer selon le langage
  switch (lang) {
    case 'javascript':
    case 'js':
    case 'jsx':
      return tokenizeJavaScript(code);
    case 'typescript':
    case 'ts':
    case 'tsx':
      return tokenizeTypeScript(code);
    case 'python':
    case 'py':
      return tokenizePython(code);
    case 'java':
      return tokenizeJava(code);
    case 'c':
    case 'cpp':
    case 'c++':
      return tokenizeC(code);
    case 'csharp':
    case 'cs':
      return tokenizeCSharp(code);
    case 'go':
      return tokenizeGo(code);
    case 'rust':
    case 'rs':
      return tokenizeRust(code);
    case 'php':
      return tokenizePHP(code);
    case 'ruby':
    case 'rb':
      return tokenizeRuby(code);
    case 'sql':
      return tokenizeSQL(code);
    case 'html':
    case 'xml':
      return tokenizeHTML(code);
    case 'css':
    case 'scss':
    case 'sass':
      return tokenizeCSS(code);
    case 'json':
      return tokenizeJSON(code);
    case 'bash':
    case 'sh':
    case 'shell':
      return tokenizeBash(code);
    default:
      return [{ type: 'text', content: code }];
  }
}

function tokenizeJavaScript(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /`(?:[^`\\]|\\.)*`/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|import|export|from|default|async|await|yield|typeof|instanceof|in|of|this|super|static|get|set|null|undefined|true|false)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeTypeScript(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /`(?:[^`\\]|\\.)*`/g },
    // Keywords (TypeScript spécifique)
    {
      type: 'keyword',
      regex: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|implements|interface|type|enum|namespace|module|import|export|from|default|async|await|yield|typeof|instanceof|in|of|this|super|static|public|private|protected|readonly|get|set|abstract|as|is|keyof|infer|never|unknown|any|void|null|undefined|true|false)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_$][\w$]*)\s*(?=\(|<)/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /#.*$/gm },
    { type: 'comment', regex: /'''[\s\S]*?'''/g },
    { type: 'comment', regex: /"""[\s\S]*?"""/g },
    // Strings
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /f'(?:[^'\\]|\\.)*'/g },
    { type: 'string', regex: /f"(?:[^"\\]|\\.)*"/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(def|class|return|if|elif|else|for|while|break|continue|pass|try|except|finally|raise|with|as|import|from|lambda|yield|async|await|global|nonlocal|assert|del|is|in|not|and|or|None|True|False|self)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\()/g },
    // Decorators
    { type: 'decorator', regex: /@[a-zA-Z_][\w]*/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeJava(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|void|int|long|double|float|boolean|char|byte|short|String|this|super|null|true|false|import|package|synchronized|volatile|transient|native|strictfp|enum)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*[fFdDlL]?\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\()/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeC(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Preprocessor
    { type: 'preprocessor', regex: /#\s*(?:include|define|ifdef|ifndef|endif|if|else|elif|pragma|undef)\b[^\n]*/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|_Bool|_Complex|_Imaginary)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*[fFuUlL]?\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\()/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeCSharp(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /@?"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|var|virtual|void|volatile|while|async|await)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*[fFdDmM]?\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\(|<)/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeGo(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /`[^`]*`/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|nil|true|false|iota)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\()/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeRust(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /r#*"(?:[^"\\]|\\.)*"#*/g },
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|abstract|become|box|do|final|macro|override|priv|typeof|unsized|virtual|yield)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\(|!)/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizePHP(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\/.*$/gm },
    { type: 'comment', regex: /#.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Variables
    { type: 'variable', regex: /\$[a-zA-Z_][\w]*/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield|null|true|false|self|parent)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\()/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeRuby(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /#.*$/gm },
    // Strings
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Symbols
    { type: 'symbol', regex: /:[a-zA-Z_][\w]*[?!]?/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(BEGIN|END|alias|and|begin|break|case|class|def|defined|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield)\b/g,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*[?!]?)\s*(?=\()/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeSQL(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /--.*$/gm },
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Strings
    { type: 'string', regex: /'(?:[^']|'')*'/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|AND|OR|NOT|IN|LIKE|BETWEEN|IS|NULL|EXISTS|CASE|WHEN|THEN|ELSE|END|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MAX|MIN|DATABASE|SCHEMA|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|DEFAULT|AUTO_INCREMENT|UNIQUE)\b/gi,
    },
    // Numbers
    { type: 'number', regex: /\b\d+\.?\d*\b/g },
    // Functions
    { type: 'function', regex: /\b([a-zA-Z_][\w]*)\s*(?=\()/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeHTML(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /<!--[\s\S]*?-->/g },
    // Doctype
    { type: 'doctype', regex: /<!DOCTYPE[^>]*>/gi },
    // Tags
    { type: 'tag', regex: /<\/?[a-zA-Z][\w-]*(?:\s[^>]*)?\/?>/g },
    // Attributes dans les tags
    { type: 'attr-name', regex: /\b[a-zA-Z-]+(?==)/g },
    // Valeurs d'attributs
    { type: 'attr-value', regex: /="[^"]*"/g },
    { type: 'attr-value', regex: /='[^']*'/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeCSS(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
    // Sélecteurs
    { type: 'selector', regex: /[.#]?[a-zA-Z][\w-]*(?=\s*\{)/g },
    // Propriétés
    { type: 'property', regex: /[a-zA-Z-]+(?=\s*:)/g },
    // Valeurs
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
    // Couleurs
    { type: 'color', regex: /#[0-9a-fA-F]{3,8}\b/g },
    // Nombres avec unités
    { type: 'number', regex: /\b\d+\.?\d*(px|em|rem|%|vh|vw|pt|cm|mm|in|pc|ex|ch|vmin|vmax|deg|rad|turn|s|ms)?\b/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeJSON(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Strings (clés et valeurs)
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    // Nombres
    { type: 'number', regex: /\b-?\d+\.?\d*([eE][+-]?\d+)?\b/g },
    // Booléens et null
    { type: 'keyword', regex: /\b(true|false|null)\b/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    // Commentaires
    { type: 'comment', regex: /#.*$/gm },
    // Strings
    { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
    { type: 'string', regex: /'(?:[^'])*'/g },
    // Variables
    { type: 'variable', regex: /\$\{?[a-zA-Z_][\w]*\}?/g },
    { type: 'variable', regex: /\$\d+/g },
    // Keywords
    {
      type: 'keyword',
      regex: /\b(if|then|else|elif|fi|case|esac|for|while|until|do|done|in|function|return|exit|break|continue|local|export|readonly|declare|typeset|unset|source|alias|bg|fg|jobs|disown|suspend|echo|printf|read|cd|pwd|pushd|popd|dirs|test)\b/g,
    },
    // Operators
    { type: 'operator', regex: /[|&;()<>]/g },
  ];

  tokenizeWithPatterns(code, patterns, tokens);
  return tokens;
}

function tokenizeWithPatterns(
  code: string,
  patterns: Array<{ type: string; regex: RegExp }>,
  tokens: Token[]
): void {
  // Créer une map de positions avec leur type
  const matches: Array<{ start: number; end: number; type: string; content: string }> = [];

  patterns.forEach(({ type, regex }) => {
    let match;
    const re = new RegExp(regex.source, regex.flags);
    while ((match = re.exec(code)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        content: match[0],
      });
    }
  });

  // Trier par position
  matches.sort((a, b) => a.start - b.start);

  // Fusionner les overlaps en gardant le premier match
  const mergedMatches: typeof matches = [];
  let lastEnd = 0;

  for (const match of matches) {
    if (match.start >= lastEnd) {
      mergedMatches.push(match);
      lastEnd = match.end;
    }
  }

  // Créer les tokens
  let currentPos = 0;
  for (const match of mergedMatches) {
    // Ajouter le texte avant le match
    if (match.start > currentPos) {
      tokens.push({
        type: 'text',
        content: code.substring(currentPos, match.start),
      });
    }

    // Ajouter le match
    tokens.push({
      type: match.type,
      content: match.content,
    });

    currentPos = match.end;
  }

  // Ajouter le reste
  if (currentPos < code.length) {
    tokens.push({
      type: 'text',
      content: code.substring(currentPos),
    });
  }
}
