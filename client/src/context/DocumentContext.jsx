import { createContext, useReducer } from 'react';

export const DocumentContext = createContext();

const initialState = {
  currentDocumentId: null,
  documentTitle: '',
  activePage: 1,
  activeTab: 'pdf', // 'pdf' | 'mindmap' | 'flashcards'
  mindMapData: null,
  flashcards: [],
};

function documentReducer(state, action) {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return {
        ...state,
        currentDocumentId: action.payload.id,
        documentTitle: action.payload.title,
        activePage: 1,
      };
    case 'SET_PAGE':
      return { ...state, activePage: action.payload };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_MINDMAP':
      return { ...state, mindMapData: action.payload };
    case 'SET_FLASHCARDS':
      return { ...state, flashcards: action.payload };
    default:
      return state;
  }
}

export function DocumentProvider({ children }) {
  const [docState, docDispatch] = useReducer(documentReducer, initialState);
  return (
    <DocumentContext.Provider value={{ docState, docDispatch }}>
      {children}
    </DocumentContext.Provider>
  );
}