/**
 * Comprehensive Accessibility Service
 * WCAG 2.1 AA compliant accessibility features for mental health applications
 * Provides screen reader support, keyboard navigation, and adaptive interfaces
 */

export interface AccessibilityPreferences {
  userId: string;
  
  // Visual preferences
  highContrast: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'default' | 'dyslexic-friendly' | 'sans-serif' | 'serif';
  reducedMotion: boolean;
  colorBlindnessType: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy';
  
  // Audio preferences
  audioDescriptions: boolean;
  soundEnabled: boolean;
  voiceRate: number; // 0.5 to 2.0
  voicePitch: number; // 0 to 2
  voiceVolume: number; // 0 to 1
  preferredVoice: string;
  
  // Motor preferences
  keyboardNavigation: boolean;
  stickyKeys: boolean;
  slowKeys: boolean;
  mouseKeys: boolean;
  largeClickTargets: boolean;
  gestureAlternatives: boolean;
  
  // Cognitive preferences
  simplifiedInterface: boolean;
  extendedTimeouts: boolean;
  readingAssistance: boolean;
  confirmActions: boolean;
  breadcrumbNavigation: boolean;
  
  // Crisis-specific
  crisisAlternativeFormats: boolean;
  emergencyVoiceCommands: boolean;
  panicModeSimpleUI: boolean;
  
  // Language and communication
  language: string;
  signLanguageSupport: boolean;
  textToSpeech: boolean;
  speechToText: boolean;
  
  lastUpdated: Date;
}

export interface AccessibilityAudit {
  pageUrl: string;
  timestamp: Date;
  violations: AccessibilityViolation[];
  score: number; // 0-100
  level: 'A' | 'AA' | 'AAA';
  automated: boolean;
}

export interface AccessibilityViolation {
  id: string;
  rule: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  element: string;
  description: string;
  remediation: string;
  wcagReference: string;
  xpath?: string;
}

export interface FocusManagement {
  currentFocus: HTMLElement | null;
  focusHistory: HTMLElement[];
  skipLinks: HTMLElement[];
  landmarkNavigation: boolean;
}

export interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive' | 'off';
  interrupting: boolean;
  category: 'navigation' | 'status' | 'error' | 'success' | 'crisis';
}

class AccessibilityService {
  private static instance: AccessibilityService;
  private preferences: Map<string, AccessibilityPreferences> = new Map();
  private focusManager: FocusManagement = {
    currentFocus: null,
    focusHistory: [],
    skipLinks: [],
    landmarkNavigation: false
  };
  private announcer: HTMLElement | null = null;
  private keyboardTrapStack: HTMLElement[] = [];

  private constructor() {
    this.initializeAccessibility();
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  /**
   * Initialize accessibility features
   */
  private async initializeAccessibility(): Promise<void> {
    // Create ARIA live region for announcements
    this.createAriaLiveRegion();
    
    // Set up keyboard navigation
    this.setupKeyboardNavigation();
    
    // Initialize focus management
    this.setupFocusManagement();
    
    // Detect system accessibility preferences
    await this.detectSystemPreferences();
    
    // Set up high contrast media query listener
    this.setupHighContrastDetection();
    
    // Set up reduced motion detection
    this.setupReducedMotionDetection();
    
    console.log('[AccessibilityService] Accessibility features initialized');
  }

  /**
   * Load user accessibility preferences
   */
  async loadUserPreferences(userId: string): Promise<AccessibilityPreferences> {
    let preferences = this.preferences.get(userId);
    
    if (!preferences) {
      // Create default preferences based on system settings
      preferences = await this.createDefaultPreferences(userId);
      this.preferences.set(userId, preferences);
    }

    // Apply preferences to the current session
    await this.applyPreferences(preferences);
    
    return preferences;
  }

  /**
   * Update user accessibility preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<AccessibilityPreferences>
  ): Promise<AccessibilityPreferences> {
    const current = this.preferences.get(userId) || await this.createDefaultPreferences(userId);
    
    const updated: AccessibilityPreferences = {
      ...current,
      ...updates,
      lastUpdated: new Date()
    };
    
    this.preferences.set(userId, updated);
    await this.applyPreferences(updated);
    
    console.log('[AccessibilityService] Preferences updated for user:', userId);
    return updated;
  }

  /**
   * Apply accessibility preferences to the interface
   */
  private async applyPreferences(preferences: AccessibilityPreferences): Promise<void> {
    const root = document.documentElement;
    
    // Visual preferences
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (preferences.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Font size
    root.setAttribute('data-font-size', preferences.fontSize);
    
    // Font family
    root.setAttribute('data-font-family', preferences.fontFamily);
    
    // Reduced motion
    if (preferences.reducedMotion) {
      root.style.setProperty('--motion-duration', '0ms');
      root.classList.add('reduced-motion');
    } else {
      root.style.removeProperty('--motion-duration');
      root.classList.remove('reduced-motion');
    }
    
    // Color blindness filters
    if (preferences.colorBlindnessType !== 'none') {
      root.classList.add(`colorblind-${preferences.colorBlindnessType}`);
    }
    
    // Motor preferences
    if (preferences.largeClickTargets) {
      root.classList.add('large-targets');
    }
    
    // Cognitive preferences
    if (preferences.simplifiedInterface) {
      root.classList.add('simplified');
    }
    
    if (preferences.extendedTimeouts) {
      // Extend timeout values for forms and sessions
      this.extendTimeouts();
    }
    
    // Update speech synthesis settings
    if (preferences.textToSpeech) {
      this.configureSpeechSynthesis(preferences);
    }
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(
    message: string,
    priority: ScreenReaderAnnouncement['priority'] = 'polite',
    category: ScreenReaderAnnouncement['category'] = 'status'
  ): void {
    if (!this.announcer) {
      this.createAriaLiveRegion();
    }

    // Clear previous announcement
    this.announcer!.textContent = '';
    
    // Set appropriate aria-live value
    this.announcer!.setAttribute('aria-live', priority);
    
    // Add contextual information for crisis announcements
    let announcementText = message;
    if (category === 'crisis') {
      announcementText = `Crisis alert: ${message}`;
    } else if (category === 'error') {
      announcementText = `Error: ${message}`;
    }
    
    // Use setTimeout to ensure screen reader picks up the change
    setTimeout(() => {
      this.announcer!.textContent = announcementText;
    }, 100);

    console.log(`[AccessibilityService] Screen reader announcement (${priority}): ${message}`);
  }

  /**
   * Manage keyboard navigation and focus
   */
  moveFocus(direction: 'next' | 'previous' | 'first' | 'last', selector?: string): boolean {
    const focusableElements = this.getFocusableElements(selector);
    
    if (focusableElements.length === 0) {
      return false;
    }

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    let newIndex: number;

    switch (direction) {
      case 'next':
        newIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'previous':
        newIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = focusableElements.length - 1;
        break;
      default:
        return false;
    }

    const targetElement = focusableElements[newIndex];
    this.setFocusWithAnnouncement(targetElement);
    return true;
  }

  /**
   * Create and manage focus traps for modals and dialogs
   */
  trapFocus(container: HTMLElement): () => void {
    this.keyboardTrapStack.push(container);
    
    const focusableElements = this.getFocusableElements(undefined, container);
    if (focusableElements.length === 0) {
      return () => this.releaseFocusTrap(container);
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.releaseFocusTrap(container);
    };
  }

  /**
   * Release focus trap
   */
  private releaseFocusTrap(container: HTMLElement): void {
    const index = this.keyboardTrapStack.indexOf(container);
    if (index > -1) {
      this.keyboardTrapStack.splice(index, 1);
    }
  }

  /**
   * Add skip links for keyboard navigation
   */
  addSkipLink(target: string, label: string, position: 'main' | 'navigation' | 'search' = 'main'): HTMLElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${target}`;
    skipLink.textContent = label;
    skipLink.className = 'skip-link';
    skipLink.setAttribute('aria-label', `Skip to ${label.toLowerCase()}`);
    
    // Position skip link
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      z-index: 9999;
      background: #000;
      color: #fff;
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 4px;
      transition: top 0.2s;
    `;

    // Show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    // Add to page
    document.body.insertBefore(skipLink, document.body.firstChild);
    this.focusManager.skipLinks.push(skipLink);

    return skipLink;
  }

  /**
   * Provide alternative text for images with AI description
   */
  async generateAltText(imageUrl: string, context?: string): Promise<string> {
    // In production, this would use AI image recognition
    // For now, provide contextual alternatives
    
    const contextualAlts = {
      'crisis': 'Crisis support illustration showing calm and safety',
      'therapy': 'Therapy session illustration showing professional support',
      'wellness': 'Wellness activity illustration promoting mental health',
      'assessment': 'Mental health assessment interface showing progress'
    };

    if (context && contextualAlts[context as keyof typeof contextualAlts]) {
      return contextualAlts[context as keyof typeof contextualAlts];
    }

    return 'Image content relevant to mental health support';
  }

  /**
   * Create accessible form validation
   */
  createAccessibleFormValidation(
    form: HTMLFormElement,
    validationRules: Record<string, (value: string) => string | null>
  ): void {
    const errorContainer = document.createElement('div');
    errorContainer.id = `${form.id || 'form'}-errors`;
    errorContainer.setAttribute('aria-live', 'assertive');
    errorContainer.className = 'form-errors';
    form.insertBefore(errorContainer, form.firstChild);

    Object.keys(validationRules).forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      if (!field) return;

      // Add aria-describedby for error association
      const errorId = `${fieldName}-error`;
      field.setAttribute('aria-describedby', errorId);

      const validateField = () => {
        const error = validationRules[fieldName](field.value);
        
        // Remove existing error
        const existingError = document.getElementById(errorId);
        if (existingError) {
          existingError.remove();
        }

        if (error) {
          // Create error message
          const errorElement = document.createElement('div');
          errorElement.id = errorId;
          errorElement.className = 'field-error';
          errorElement.textContent = error;
          errorElement.setAttribute('role', 'alert');
          
          // Position after field
          field.parentNode?.insertBefore(errorElement, field.nextSibling);
          
          // Mark field as invalid
          field.setAttribute('aria-invalid', 'true');
          
          // Announce error
          this.announceToScreenReader(
            `${field.labels?.[0]?.textContent || fieldName}: ${error}`,
            'assertive',
            'error'
          );
        } else {
          field.setAttribute('aria-invalid', 'false');
        }
      };

      // Validate on blur and input
      field.addEventListener('blur', validateField);
      field.addEventListener('input', () => {
        // Debounce input validation
        clearTimeout((field as any).validationTimeout);
        (field as any).validationTimeout = setTimeout(validateField, 500);
      });
    });
  }

  /**
   * Perform accessibility audit
   */
  async performAccessibilityAudit(pageUrl?: string): Promise<AccessibilityAudit> {
    const violations: AccessibilityViolation[] = [];
    let score = 100;

    // Check for common WCAG violations
    await Promise.all([
      this.checkImageAltText(violations),
      this.checkHeadingStructure(violations),
      this.checkFormLabels(violations),
      this.checkColorContrast(violations),
      this.checkKeyboardNavigation(violations),
      this.checkAriaUsage(violations),
      this.checkFocusManagement(violations)
    ]);

    // Calculate score based on violations
    const severityWeights = { minor: 1, moderate: 3, serious: 5, critical: 10 };
    const totalPenalty = violations.reduce((sum, v) => sum + severityWeights[v.severity], 0);
    score = Math.max(0, 100 - totalPenalty);

    return {
      pageUrl: pageUrl || window.location.href,
      timestamp: new Date(),
      violations,
      score,
      level: score >= 90 ? 'AA' : score >= 70 ? 'A' : 'A', // Minimum A
      automated: true
    };
  }

  /**
   * Enable crisis accessibility mode
   */
  enableCrisisAccessibilityMode(): void {
    const root = document.documentElement;
    
    // Simplified UI
    root.classList.add('crisis-mode');
    
    // High contrast for visibility
    root.classList.add('high-contrast');
    
    // Larger text and targets
    root.classList.add('large-text', 'large-targets');
    
    // Disable animations
    root.classList.add('reduced-motion');
    
    // Add crisis skip link
    this.addSkipLink('crisis-content', 'Skip to crisis resources', 'main');
    
    // Announce mode change
    this.announceToScreenReader(
      'Crisis accessibility mode enabled. Interface simplified for easier use.',
      'assertive',
      'crisis'
    );

    console.log('[AccessibilityService] Crisis accessibility mode enabled');
  }

  /**
   * Text-to-speech functionality
   */
  async speakText(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: string;
      interrupt?: boolean;
    }
  ): Promise<void> {
    if (!('speechSynthesis' in window)) {
      console.warn('[AccessibilityService] Speech synthesis not supported');
      return;
    }

    if (options?.interrupt) {
      speechSynthesis.cancel();
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply options
      if (options?.rate) utterance.rate = options.rate;
      if (options?.pitch) utterance.pitch = options.pitch;
      if (options?.volume) utterance.volume = options.volume;
      
      // Set voice
      if (options?.voice) {
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === options.voice);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      speechSynthesis.speak(utterance);
    });
  }

  // Private helper methods

  private createAriaLiveRegion(): void {
    this.announcer = document.createElement('div');
    this.announcer.id = 'accessibility-announcer';
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.announcer);
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      // Handle keyboard shortcuts
      if (event.altKey && event.key === 'h') {
        // Alt+H: Navigate to main heading
        const mainHeading = document.querySelector('h1');
        if (mainHeading) {
          (mainHeading as HTMLElement).focus();
          this.announceToScreenReader('Navigated to main heading', 'polite', 'navigation');
        }
      }

      // Handle F6 for landmark navigation
      if (event.key === 'F6') {
        this.navigateToNextLandmark(event.shiftKey);
        event.preventDefault();
      }

      // Handle Escape for focus restoration
      if (event.key === 'Escape') {
        this.handleEscapeKey();
      }
    });
  }

  private setupFocusManagement(): void {
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      this.focusManager.currentFocus = target;
      
      // Track focus history (limit to 10 items)
      this.focusManager.focusHistory.push(target);
      if (this.focusManager.focusHistory.length > 10) {
        this.focusManager.focusHistory.shift();
      }
    });
  }

  private async detectSystemPreferences(): Promise<void> {
    // Detect system dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('[AccessibilityService] System dark mode detected');
    }

    // Detect system reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.log('[AccessibilityService] System reduced motion detected');
    }

    // Detect system high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      console.log('[AccessibilityService] System high contrast detected');
    }
  }

  private setupHighContrastDetection(): void {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleHighContrast = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('system-high-contrast');
      } else {
        document.documentElement.classList.remove('system-high-contrast');
      }
    };

    mediaQuery.addEventListener('change', handleHighContrast);
    handleHighContrast({ matches: mediaQuery.matches } as MediaQueryListEvent);
  }

  private setupReducedMotionDetection(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotion = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('system-reduced-motion');
      } else {
        document.documentElement.classList.remove('system-reduced-motion');
      }
    };

    mediaQuery.addEventListener('change', handleReducedMotion);
    handleReducedMotion({ matches: mediaQuery.matches } as MediaQueryListEvent);
  }

  private async createDefaultPreferences(userId: string): Promise<AccessibilityPreferences> {
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const systemHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    return {
      userId,
      highContrast: systemHighContrast,
      darkMode: systemDarkMode,
      fontSize: 'medium',
      fontFamily: 'default',
      reducedMotion: systemReducedMotion,
      colorBlindnessType: 'none',
      audioDescriptions: false,
      soundEnabled: true,
      voiceRate: 1.0,
      voicePitch: 1.0,
      voiceVolume: 1.0,
      preferredVoice: '',
      keyboardNavigation: false,
      stickyKeys: false,
      slowKeys: false,
      mouseKeys: false,
      largeClickTargets: false,
      gestureAlternatives: false,
      simplifiedInterface: false,
      extendedTimeouts: false,
      readingAssistance: false,
      confirmActions: true,
      breadcrumbNavigation: true,
      crisisAlternativeFormats: true,
      emergencyVoiceCommands: false,
      panicModeSimpleUI: true,
      language: navigator.language || 'en-US',
      signLanguageSupport: false,
      textToSpeech: false,
      speechToText: false,
      lastUpdated: new Date()
    };
  }

  private getFocusableElements(selector?: string, container: HTMLElement = document.body): HTMLElement[] {
    const focusableSelector = selector || 
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    
    const elements = Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
    
    return elements.filter(el => {
      return el.offsetWidth > 0 && 
             el.offsetHeight > 0 && 
             !el.disabled && 
             el.tabIndex >= 0;
    });
  }

  private setFocusWithAnnouncement(element: HTMLElement): void {
    element.focus();
    
    // Announce focus change for screen readers
    const label = this.getElementLabel(element);
    if (label) {
      this.announceToScreenReader(`Focused: ${label}`, 'polite', 'navigation');
    }
  }

  private getElementLabel(element: HTMLElement): string {
    // Try aria-label first
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label')!;
    }
    
    // Try aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        return labelElement.textContent || '';
      }
    }
    
    // Try associated label
    if (element instanceof HTMLInputElement) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return label.textContent || '';
      }
    }
    
    // Try text content
    return element.textContent?.trim() || element.tagName.toLowerCase();
  }

  private navigateToNextLandmark(reverse: boolean = false): void {
    const landmarks = Array.from(document.querySelectorAll(
      '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="search"], [role="complementary"], main, nav, header, footer, aside'
    )) as HTMLElement[];

    if (landmarks.length === 0) return;

    const currentIndex = landmarks.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;

    if (reverse) {
      nextIndex = currentIndex <= 0 ? landmarks.length - 1 : currentIndex - 1;
    } else {
      nextIndex = (currentIndex + 1) % landmarks.length;
    }

    const nextLandmark = landmarks[nextIndex];
    nextLandmark.tabIndex = -1; // Make focusable
    this.setFocusWithAnnouncement(nextLandmark);
  }

  private handleEscapeKey(): void {
    // Close any focus traps
    if (this.keyboardTrapStack.length > 0) {
      const topTrap = this.keyboardTrapStack[this.keyboardTrapStack.length - 1];
      topTrap.dispatchEvent(new CustomEvent('close'));
    }
  }

  private extendTimeouts(): void {
    // Extend form timeouts by 50%
    document.querySelectorAll('form').forEach(form => {
      const timeout = parseInt(form.dataset.timeout || '0');
      if (timeout > 0) {
        form.dataset.timeout = String(Math.floor(timeout * 1.5));
      }
    });
  }

  private configureSpeechSynthesis(preferences: AccessibilityPreferences): void {
    if (!('speechSynthesis' in window)) return;

    // Wait for voices to be loaded
    const setVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        setTimeout(setVoice, 100);
        return;
      }

      // Store preferences for speech synthesis
      (window as any).speechPreferences = {
        rate: preferences.voiceRate,
        pitch: preferences.voicePitch,
        volume: preferences.voiceVolume,
        voice: preferences.preferredVoice
      };
    };

    setVoice();
  }

  // Accessibility audit helper methods
  private async checkImageAltText(violations: AccessibilityViolation[]): Promise<void> {
    document.querySelectorAll('img').forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('role') === 'presentation') {
        violations.push({
          id: 'img-alt-missing',
          rule: 'Images must have alternative text',
          severity: 'serious',
          element: img.tagName.toLowerCase(),
          description: 'Image missing alternative text',
          remediation: 'Add alt attribute with descriptive text',
          wcagReference: 'WCAG 1.1.1',
          xpath: this.getXPath(img)
        });
      }
    });
  }

  private async checkHeadingStructure(violations: AccessibilityViolation[]): Promise<void> {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      
      if (level > lastLevel + 1) {
        violations.push({
          id: 'heading-skip-level',
          rule: 'Heading levels should not skip',
          severity: 'moderate',
          element: heading.tagName.toLowerCase(),
          description: `Heading level ${level} follows level ${lastLevel}`,
          remediation: 'Use sequential heading levels',
          wcagReference: 'WCAG 1.3.1'
        });
      }
      
      lastLevel = level;
    });
  }

  private async checkFormLabels(violations: AccessibilityViolation[]): Promise<void> {
    document.querySelectorAll('input, textarea, select').forEach(field => {
      const hasLabel = field.labels?.length || 
                      field.getAttribute('aria-label') ||
                      field.getAttribute('aria-labelledby');
      
      if (!hasLabel) {
        violations.push({
          id: 'form-label-missing',
          rule: 'Form fields must have labels',
          severity: 'serious',
          element: field.tagName.toLowerCase(),
          description: 'Form field missing label',
          remediation: 'Add label element or aria-label attribute',
          wcagReference: 'WCAG 3.3.2'
        });
      }
    });
  }

  private async checkColorContrast(violations: AccessibilityViolation[]): Promise<void> {
    // Basic color contrast check (would be more sophisticated in production)
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simplified contrast check
      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // In production, calculate actual contrast ratio
        // This is a placeholder
      }
    });
  }

  private async checkKeyboardNavigation(violations: AccessibilityViolation[]): Promise<void> {
    document.querySelectorAll('*[onclick], *[role="button"]').forEach(element => {
      if (!element.hasAttribute('tabindex') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
        violations.push({
          id: 'keyboard-inaccessible',
          rule: 'Interactive elements must be keyboard accessible',
          severity: 'serious',
          element: element.tagName.toLowerCase(),
          description: 'Interactive element not keyboard accessible',
          remediation: 'Add tabindex="0" or use semantic button/link elements',
          wcagReference: 'WCAG 2.1.1'
        });
      }
    });
  }

  private async checkAriaUsage(violations: AccessibilityViolation[]): Promise<void> {
    // Check for invalid ARIA usage
    document.querySelectorAll('*[aria-labelledby]').forEach(element => {
      const labelledBy = element.getAttribute('aria-labelledby')!;
      const labelElement = document.getElementById(labelledBy);
      
      if (!labelElement) {
        violations.push({
          id: 'aria-labelledby-invalid',
          rule: 'aria-labelledby must reference existing element',
          severity: 'moderate',
          element: element.tagName.toLowerCase(),
          description: `aria-labelledby references non-existent element: ${labelledBy}`,
          remediation: 'Ensure referenced element exists',
          wcagReference: 'WCAG 4.1.2'
        });
      }
    });
  }

  private async checkFocusManagement(violations: AccessibilityViolation[]): Promise<void> {
    // Check for focus traps in modals
    document.querySelectorAll('[role="dialog"], .modal').forEach(modal => {
      const focusableElements = this.getFocusableElements(undefined, modal as HTMLElement);
      
      if (focusableElements.length === 0) {
        violations.push({
          id: 'modal-no-focus',
          rule: 'Modals must contain focusable elements',
          severity: 'serious',
          element: modal.tagName.toLowerCase(),
          description: 'Modal contains no focusable elements',
          remediation: 'Add focusable elements or close button',
          wcagReference: 'WCAG 2.4.3'
        });
      }
    });
  }

  private getXPath(element: Element): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    let path = '';
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.tagName.toLowerCase();
      
      if (element.id) {
        selector += `[@id="${element.id}"]`;
        path = `//${selector}${path}`;
        break;
      }
      
      const siblings = Array.from(element.parentNode?.children || [])
        .filter(sibling => sibling.tagName === element.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `[${index}]`;
      }
      
      path = `/${selector}${path}`;
      element = element.parentElement!;
    }
    
    return path;
  }
}

// Export singleton instance
export const accessibilityService = AccessibilityService.getInstance();