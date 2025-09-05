/**
 * @fileoverview useIssueFlowContext Hook
 * 
 * Hook to access IssueFlow context.
 * Must be used within an IssueFlowProvider.
 */

import { useContext } from 'react';
import { IssueFlowContext } from '../components/IssueFlowProvider';
import type { IssueFlowContextValue } from '../types';

export function useIssueFlowContext(): IssueFlowContextValue {
  const context = useContext(IssueFlowContext);
  
  if (!context) {
    throw new Error(
      'useIssueFlowContext must be used within an IssueFlowProvider. ' +
      'Make sure to wrap your app or component tree with <IssueFlowProvider>.'
    );
  }
  
  return context;
}