export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export class ValidationUtils {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    if (!email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true, message: '' };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (password.length > 50) {
      return { isValid: false, message: 'Password must be less than 50 characters' };
    }
    
    return { isValid: true, message: '' };
  }

  // Confirm password validation
  static validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
    if (!confirmPassword) {
      return { isValid: false, message: 'Please confirm your password' };
    }
    
    if (password !== confirmPassword) {
      return { isValid: false, message: 'Passwords do not match' };
    }
    
    return { isValid: true, message: '' };
  }

  // Name validation
  static validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    if (!name.trim()) {
      return { isValid: false, message: `${fieldName} is required` };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, message: `${fieldName} must be at least 2 characters long` };
    }
    
    if (name.trim().length > 50) {
      return { isValid: false, message: `${fieldName} must be less than 50 characters` };
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name.trim())) {
      return { isValid: false, message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
    }
    
    return { isValid: true, message: '' };
  }

  // Phone number validation
  static validatePhoneNumber(phone: string): ValidationResult {
    if (!phone.trim()) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return { isValid: false, message: 'Phone number must be at least 10 digits' };
    }
    
    if (cleanPhone.length > 15) {
      return { isValid: false, message: 'Phone number must be less than 15 digits' };
    }
    
    return { isValid: true, message: '' };
  }

  // Phone code validation
  static validatePhoneCode(phoneCode: string): ValidationResult {
    if (!phoneCode) {
      return { isValid: false, message: 'Country code is required' };
    }
    
    const validCodes = ['+1', '+44', '+60', '+61', '+62', '+65', '+86', '+91', '+880', '+973'];
    if (!validCodes.includes(phoneCode)) {
      return { isValid: false, message: 'Please select a valid country code' };
    }
    
    return { isValid: true, message: '' };
  }

  // Login form validation
  static validateLoginForm(email: string, password: string): { isValid: boolean; errors: { [key: string]: string } } {
    const errors: { [key: string]: string } = {};
    
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Registration form validation
  static validateRegistrationForm(formData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneCode: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }): { isValid: boolean; errors: { [key: string]: string } } {
    const errors: { [key: string]: string } = {};
    
    // First name validation
    const firstNameValidation = this.validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.message;
    }
    
    // Last name validation
    const lastNameValidation = this.validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.message;
    }
    
    // Email validation
    const emailValidation = this.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    // Phone code validation
    const phoneCodeValidation = this.validatePhoneCode(formData.phoneCode);
    if (!phoneCodeValidation.isValid) {
      errors.phoneCode = phoneCodeValidation.message;
    }
    
    // Phone validation
    const phoneValidation = this.validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.message;
    }
    
    // Password validation
    const passwordValidation = this.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
    
    // Confirm password validation
    const confirmPasswordValidation = this.validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      errors.confirmPassword = confirmPasswordValidation.message;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
