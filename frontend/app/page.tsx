'use client';

import { useEffect, useState } from 'react';
import UrlForm from '../components/UrlForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ResultsView from '../components/ResultsView';
import { extractList } from '../lib/api';
import { getStoredUrl, setStoredUrl, clearStoredUrl } from '../lib/storage';
import type { ExtractSuccess, ExtractErrorCode } from '../lib/types';

type ViewState =
  | { step: 'input'; initialUrl?: string }
  | { step: 'loading' }
  | { step: 'results'; data: ExtractSuccess }
  | { step: 'error'; errorCode: ExtractErrorCode; message?: string; retryUrl?: string };

export default function Home() {
  const [state, setState] = useState<ViewState>({ step: 'input' });
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    const stored = getStoredUrl();
    if (stored) {
      runExtraction(stored);
    } else {
      setState({ step: 'input' });
    }
    setCheckedStorage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runExtraction(url: string) {
    setState({ step: 'loading' });
    const result = await extractList(url);
    if (result.success) {
      setState({ step: 'results', data: result });
    } else {
      setState({ step: 'error', errorCode: result.errorCode, message: result.message, retryUrl: url });
    }
  }

  function handleSubmit(url: string, remember: boolean) {
    if (remember) setStoredUrl(url);
    else clearStoredUrl();
    runExtraction(url);
  }

  function handleRetry() {
    const retryUrl = state.step === 'error' ? state.retryUrl : undefined;
    clearStoredUrl();
    setState({ step: 'input', initialUrl: retryUrl });
  }

  if (!checkedStorage) return null;

  switch (state.step) {
    case 'loading':
      return <LoadingState />;
    case 'results':
      return <ResultsView data={state.data} onRetry={handleRetry} />;
    case 'error':
      return <ErrorState errorCode={state.errorCode} message={state.message} onRetry={handleRetry} />;
    case 'input':
    default:
      return <UrlForm initialUrl={state.initialUrl} onSubmit={handleSubmit} />;
  }
}
