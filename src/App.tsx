import { ErrorBoundary } from 'react-error-boundary';
import MKMStudyApp from './components/MKMStudyApp';

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 border border-red-700">
        <h2 className="text-2xl font-bold text-red-500 mb-4">오류가 발생했습니다</h2>
        <p className="text-gray-300 mb-4">{errorMessage}</p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          다시 시작하기
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MKMStudyApp />
    </ErrorBoundary>
  );
}

export default App;
