// Shared by the build and browser so study links and saved scopes stay aligned.
export const examScopes=['guoxin','cosco','current','tower','tower-ai'];
export const chapterRoute=scope=>scope==='current'?'current-affairs.html':scope==='tower-ai'?'professional-tower-ai.html':`culture-${scope}.html`;
export const scopeSection=scope=>scope==='current'?'current':scope==='tower-ai'?'professional':'culture';
