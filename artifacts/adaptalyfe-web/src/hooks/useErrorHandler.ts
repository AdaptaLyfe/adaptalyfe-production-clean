import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export type ErrorType = 'network' | 'validation' | 'auth' | 'server' | 'unknown';

interface ErrorDetails {
  message: string;
  type: ErrorType;
  originalError?: any;
  context?: string;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    const errorDetails = parseError(error, context);
    
    // Log error for analytics
    console.error(`[${errorDetails.type}] ${errorDetails.context || 'Unknown'}:`, errorDetails.originalError);
    
    // Show user-friendly message
    toast({
      title: getErrorTitle(errorDetails.type),
      description: errorDetails.message,
      variant: "destructive",
    });

    return errorDetails;
  }, [toast]);

  const handleNetworkError = useCallback((error: any, context?: string) => {
    return handleError(error, context);
  }, [handleError]);

  const handleValidationError = useCallback((error: any, context?: string) => {
    const errorDetails = parseError(error, context);
    
    toast({
      title: "Please check your input",
      description: errorDetails.message,
      variant: "destructive",
    });

    return errorDetails;
  }, [toast]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
  };
}

function parseError(error: any, context?: string): ErrorDetails {
  // Handle different error types
  if (error?.response?.status === 401) {
    return {
      message: "Your session has expired. Please refresh the page.",
      type: 'auth',
      originalError: error,
      context,
    };
  }

  if (error?.response?.status === 422 || error?.message?.includes('validation')) {
    return {
      message: error?.response?.data?.message || "Please check your input and try again.",
      type: 'validation',
      originalError: error,
      context,
    };
  }

  if (error?.response?.status >= 500) {
    return {
      message: "Our servers are having trouble. Please try again in a moment.",
      type: 'server',
      originalError: error,
      context,
    };
  }

  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return {
      message: "Please check your internet connection and try again.",
      type: 'network',
      originalError: error,
      context,
    };
  }

  // Parse API error messages
  const apiMessage = error?.response?.data?.message || error?.message;
  if (apiMessage && typeof apiMessage === 'string') {
    return {
      message: apiMessage,
      type: 'unknown',
      originalError: error,
      context,
    };
  }

  return {
    message: "Something unexpected happened. Please try again.",
    type: 'unknown',
    originalError: error,
    context,
  };
}

function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case 'network':
      return "Connection Problem";
    case 'validation':
      return "Input Error";
    case 'auth':
      return "Session Expired";
    case 'server':
      return "Server Error";
    default:
      return "Error";
  }
}