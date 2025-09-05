/**
 * @fileoverview IssueFlowTrigger Component
 * 
 * Customizable trigger button for opening the IssueFlow widget.
 */

import React from 'react';
import type { ReactNode } from 'react';
import type { IssueFlowConfig } from '../types';

export interface IssueFlowTriggerProps {
  onClick: () => void;
  text?: string;
  icon?: ReactNode | string;
  config: IssueFlowConfig;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function IssueFlowTrigger({
  onClick,
  text = 'Feedback',
  icon,
  config,
  className,
  style,
  disabled = false,
}: IssueFlowTriggerProps) {
  const triggerType = config.widget?.trigger || 'button';
  
  // Default icon
  const defaultIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 16c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6c0 1.084.297 2.097.814 2.97L1.5 15.25l2.28-1.314C4.903 15.023 6.409 16 8 16z"/>
    </svg>
  );
  
  // Base styles
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: triggerType === 'tab' ? '12px 16px' : '12px 16px',
    backgroundColor: 'var(--if-primary, #3b82f6)',
    color: '#ffffff',
    border: 'none',
    borderRadius: triggerType === 'tab' ? '8px 8px 0 0' : 'var(--if-border-radius, 8px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--if-font-family, inherit)',
    fontSize: 'var(--if-font-size, 14px)',
    fontWeight: '500',
    lineHeight: '1',
    boxShadow: 'var(--if-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
    transition: 'all 0.2s ease-in-out',
    transform: 'scale(1)',
    opacity: disabled ? 0.6 : 1,
    userSelect: 'none' as const,
    ...style,
  };
  
  // Tab-specific styles
  if (triggerType === 'tab') {
    baseStyles.writing = 'vertical-rl';
    baseStyles.textOrientation = 'mixed';
    baseStyles.transform = 'rotate(180deg)';
  }
  
  // Hover and active states (CSS-in-JS simulation)
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.boxShadow = 'var(--if-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))';
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = 'var(--if-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))';
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'scale(0.95)';
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'scale(1.05)';
  };
  
  // Render icon
  const renderIcon = () => {
    if (!icon && triggerType !== 'button') return null;
    
    const iconElement = icon || defaultIcon;
    
    if (typeof iconElement === 'string') {
      return <span dangerouslySetInnerHTML={{ __html: iconElement }} />;
    }
    
    return iconElement;
  };
  
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={className}
      style={baseStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled}
      aria-label={`Open ${text.toLowerCase()} form`}
    >
      {renderIcon()}
      {(triggerType === 'button' || triggerType === 'tab') && (
        <span>{text}</span>
      )}
    </button>
  );
}