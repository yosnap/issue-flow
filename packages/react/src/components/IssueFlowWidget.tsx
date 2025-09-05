/**
 * @fileoverview IssueFlowWidget Component
 * 
 * Main widget component that provides the complete IssueFlow experience.
 * Includes trigger, modal, form, and all interactions.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { IssueFlowWidgetProps } from '../types';
import { useIssueFlow } from '../hooks/useIssueFlow';
import { IssueFlowTrigger } from './IssueFlowTrigger';
import { IssueForm } from './IssueForm';
import { createPortal } from 'react-dom';

export function IssueFlowWidget({
  config = {},
  onIssueSubmit,
  onIssueSuccess,
  onIssueError,
  onOpen,
  onClose,
  trigger,
  visible = true,
  disabled = false,
}: IssueFlowWidgetProps) {
  const issueFlow = useIssueFlow({ config, debug: config.behavior?.debug });
  const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);
  
  // Create or get mount point for portal
  useEffect(() => {
    let element = document.getElementById('issueflow-widget-root');
    
    if (!element) {
      element = document.createElement('div');
      element.id = 'issueflow-widget-root';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.pointerEvents = 'none';
      element.style.zIndex = (config.widget?.zIndex || 999999).toString();
      document.body.appendChild(element);
    }
    
    setMountPoint(element);
    
    return () => {
      // Don't remove the element on unmount, other widgets might be using it
    };
  }, [config.widget?.zIndex]);
  
  // Handle issue submission
  const handleIssueSubmit = useCallback(async (issueData: any) => {
    try {
      // Call custom handler if provided
      if (onIssueSubmit) {
        await onIssueSubmit(issueData);
      }
      
      // Submit through IssueFlow
      const issue = await issueFlow.submitIssue(issueData);
      
      // Call success handler
      if (onIssueSuccess) {
        onIssueSuccess(issue);
      }
      
    } catch (error) {
      if (onIssueError) {
        onIssueError(error as Error);
      }
      throw error; // Re-throw for form error handling
    }
  }, [onIssueSubmit, onIssueSuccess, onIssueError, issueFlow]);
  
  // Handle widget open/close events
  useEffect(() => {
    if (issueFlow.isOpen && onOpen) {
      onOpen();
    } else if (!issueFlow.isOpen && onClose) {
      onClose();
    }
  }, [issueFlow.isOpen, onOpen, onClose]);
  
  // Position styles
  const positionStyles = useMemo(() => {
    const position = config.widget?.position || 'bottom-right';
    const offset = config.widget?.offset || { x: 20, y: 20 };
    
    const styles: React.CSSProperties = {
      position: 'fixed' as const,
      zIndex: (config.widget?.zIndex || 999999),
    };
    
    switch (position) {
      case 'bottom-right':
        styles.bottom = offset.y;
        styles.right = offset.x;
        break;
      case 'bottom-left':
        styles.bottom = offset.y;
        styles.left = offset.x;
        break;
      case 'top-right':
        styles.top = offset.y;
        styles.right = offset.x;
        break;
      case 'top-left':
        styles.top = offset.y;
        styles.left = offset.x;
        break;
    }
    
    return styles;
  }, [config.widget?.position, config.widget?.offset, config.widget?.zIndex]);
  
  // Widget styles
  const widgetStyles: React.CSSProperties = {
    fontFamily: 'var(--if-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    fontSize: 'var(--if-font-size, 14px)',
    lineHeight: 'var(--if-line-height, 1.5)',
  };
  
  // Modal backdrop styles
  const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: (config.widget?.zIndex || 999999),
    pointerEvents: 'auto',
  };
  
  // Modal content styles
  const modalStyles: React.CSSProperties = {
    backgroundColor: 'var(--if-background, #ffffff)',
    borderRadius: 'var(--if-border-radius, 8px)',
    boxShadow: 'var(--if-shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
    width: config.widget?.width || '100%',
    height: config.widget?.height || 'auto',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative' as const,
  };
  
  // Don't render if not visible or disabled
  if (!visible || disabled) {
    return null;
  }
  
  // Don't render if context is not initialized
  if (!issueFlow.config) {
    return null;
  }
  
  // Render widget
  const widgetContent = (
    <div style={widgetStyles} className={config.widget?.className}>
      {/* Trigger Button */}
      {!issueFlow.isOpen && (
        <div style={positionStyles}>
          {trigger ? (
            <div onClick={issueFlow.open} style={{ cursor: 'pointer' }}>
              {trigger}
            </div>
          ) : (
            <IssueFlowTrigger
              onClick={issueFlow.open}
              text={config.widget?.triggerText}
              icon={config.widget?.triggerIcon}
              config={issueFlow.config}
            />
          )}
        </div>
      )}
      
      {/* Modal */}
      {issueFlow.isOpen && (
        <div 
          style={backdropStyles}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              issueFlow.close();
            }
          }}
        >
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={issueFlow.close}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--if-text, #666)',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
              }}
              aria-label="Close feedback form"
            >
              ×
            </button>
            
            {/* Issue Form */}
            <IssueForm
              config={issueFlow.config}
              onSubmit={handleIssueSubmit}
              onCancel={issueFlow.close}
              loading={issueFlow.isSubmitting}
              error={issueFlow.error}
            />
          </div>
        </div>
      )}
    </div>
  );
  
  // Render in portal if mount point is available
  if (mountPoint) {
    return createPortal(widgetContent, mountPoint);
  }
  
  // Fallback to direct render
  return widgetContent;
}