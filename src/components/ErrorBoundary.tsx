import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  /** Nom de la page/zone, affiché dans le message d'erreur */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Intercepte les erreurs React non gérées dans l'arbre enfant et
 * affiche un écran de repli au lieu de laisser l'application planter.
 *
 * Utilisation :
 *   <ErrorBoundary name="CartePage"><CartePage /></ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? ` – ${this.props.name}` : ''}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800">
          Une erreur inattendue s'est produite
          {this.props.name ? ` dans ${this.props.name}` : ''}.
        </h2>
        <p className="text-sm text-gray-500 max-w-md">
          {this.state.error?.message ?? 'Erreur inconnue'}
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }
}
