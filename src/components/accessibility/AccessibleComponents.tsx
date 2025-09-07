'use client';

import React, { forwardRef, useEffect, useRef, useState, ReactNode, HTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccessibilityService, accessibility } from '@/lib/accessibility';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Generate ID function
const generateId = AccessibilityService.generateId;

// Accessible Button Component
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    loadingText = 'Loading...',
    iconLeft,
    iconRight,
    disabled,
    className = '',
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const buttonId = useRef(AccessibilityService.generateId('button')).current;
    const loadingId = useRef(AccessibilityService.generateId('loading')).current;

    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-lg
      focus:outline-none focus:ring-2 focus:ring-offset-2
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <button
        ref={ref}
        id={buttonId}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        aria-describedby={loading ? `${loadingId} ${ariaDescribedBy || ''}`.trim() : ariaDescribedBy}
        {...props}
      >
        {loading && (
          <div
            id={loadingId}
            className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-current"
            aria-hidden="true"
          />
        )}
        {!loading && iconLeft && <span className="mr-2" aria-hidden="true">{iconLeft}</span>}
        
        <span>
          {loading ? loadingText : children}
        </span>
        
        {!loading && iconRight && <span className="ml-2" aria-hidden="true">{iconRight}</span>}
        
        {loading && <span className="sr-only">{loadingText}</span>}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Accessible Modal Component
export interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  initialFocus
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(AccessibilityService.generateId('modal-title')).current;
  const descId = useRef(AccessibilityService.generateId('modal-desc')).current;
  const [cleanupFocusTrap, setCleanupFocusTrap] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Setup focus trap
      const cleanup = AccessibilityService.trapFocus(modalRef.current);
      setCleanupFocusTrap(() => cleanup);
      
      // Focus initial element or first focusable element
      setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus();
        } else {
          const focusableElements = modalRef.current!.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstFocusable = focusableElements[0] as HTMLElement;
          firstFocusable?.focus();
        }
      }, 100);
      
      // Announce modal opening
      AccessibilityService.announce(`Dialog opened: ${title}`, 'assertive');
      
      // Hide main content from screen readers
      const main = document.querySelector('main, #__next, .app');
      if (main) {
        main.setAttribute('aria-hidden', 'true');
      }
      
      return () => {
        // Cleanup focus trap
        if (cleanupFocusTrap) {
          cleanupFocusTrap();
        }
        
        // Show main content to screen readers
        if (main) {
          main.removeAttribute('aria-hidden');
        }
        
        // Announce modal closing
        AccessibilityService.announce('Dialog closed');
      };
    }
    
    // Return empty cleanup function if modal is not open
    return () => {};
  }, [isOpen, initialFocus, title, cleanupFocusTrap]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const motionProps = AccessibilityService.prefersReducedMotion() ? {} : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
        >
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleOverlayClick}
              aria-hidden="true"
            />

            {/* Modal Panel */}
            <motion.div
              ref={modalRef}
              className={`relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6 ${sizeClasses[size]}`}
              role="dialog"
              aria-modal="true"
              onKeyDown={handleKeyDown}
              {...motionProps}
            >
              {/* Title */}
              <div className="mb-4">
                <h3 id={titleId} className="text-lg font-medium leading-6 text-gray-900">
                  {title}
                </h3>
                {description && (
                  <p id={descId} className="mt-2 text-sm text-gray-500">
                    {description}
                  </p>
                )}
              </div>

              {/* Content */}
              <div className="mb-4">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Accessible Form Field Component
export interface AccessibleFormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: ReactNode;
  error?: string;
  description?: string;
  required?: boolean;
  'aria-describedby'?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  children,
  error,
  description,
  required = false,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const fieldId = useRef(AccessibilityService.generateId('field')).current;
  const errorId = useRef(AccessibilityService.generateId('error')).current;
  const descId = useRef(AccessibilityService.generateId('desc')).current;

  const describedBy = [
    description ? descId : '',
    error ? errorId : '',
    ariaDescribedBy || ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descId} className="text-sm text-gray-600">
          {description}
        </p>
      )}

      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': describedBy || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required ? 'true' : undefined,
        })}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          <ExclamationTriangleIcon className="inline w-4 h-4 mr-1" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Alert Component
export interface AccessibleAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  type,
  title,
  children,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  useEffect(() => {
    // Announce important alerts to screen readers
    if (type === 'error' && title) {
      AccessibilityService.announce(title, 'assertive');
    } else if (type === 'success' && title) {
      AccessibilityService.announce(title, 'polite');
    }
  }, [type, title]);

  const typeConfig = {
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-800'
    },
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-400',
      textColor: 'text-green-800'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-400',
      textColor: 'text-yellow-800'
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      textColor: 'text-red-800'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-md border p-4 ${config.bgColor} ${config.borderColor} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.textColor}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm ${config.textColor}`}>
            {children}
          </div>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 ${config.textColor} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                aria-label="Dismiss alert"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Accessible Loading Component
export interface AccessibleLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const AccessibleLoading: React.FC<AccessibleLoadingProps> = ({
  size = 'md',
  text = 'Loading...',
  overlay = false,
  className = ''
}) => {
  useEffect(() => {
    AccessibilityService.announce(text, 'polite');
  }, [text]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={text}
      >
        <span className="sr-only">{text}</span>
      </div>
      {text && size !== 'sm' && (
        <span className="ml-3 text-sm text-gray-600">{text}</span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
        aria-label={text}
        role="status"
      >
        <div className="bg-white rounded-lg p-6">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Accessible Skip Link Component
export interface AccessibleSkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export const AccessibleSkipLink: React.FC<AccessibleSkipLinkProps> = ({
  href,
  children,
  className = ''
}) => {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        z-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      {children}
    </a>
  );
};

// Accessible Breadcrumb Component
export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface AccessibleBreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

export const AccessibleBreadcrumb: React.FC<AccessibleBreadcrumbProps> = ({
  items,
  separator = '/',
  className = ''
}) => {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={item.current ? 'text-gray-900 font-medium' : 'text-gray-500'}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};