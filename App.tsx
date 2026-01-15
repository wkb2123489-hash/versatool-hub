
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { useTranslation } from './LanguageContext';

// Lazy load tools for performance
const CaseConverter = lazy(() => import('./pages/text/CaseConverter'));
const WordCounter = lazy(() => import('./pages/text/WordCounter'));
const LoremIpsum = lazy(() => import('./pages/text/LoremIpsum'));
const TextDiff = lazy(() => import('./pages/text/TextDiff'));
const WordFrequency = lazy(() => import('./pages/text/WordFrequency'));
const JSONFormatter = lazy(() => import('./pages/dev/JSONFormatter'));
const MockDataGen = lazy(() => import('./pages/dev/MockDataGen'));
const Base64Tool = lazy(() => import('./pages/dev/Base64Tool'));
const PasswordGen = lazy(() => import('./pages/security/PasswordGen'));
const TimestampConverter = lazy(() => import('./pages/dev/TimestampConverter'));
const QRCodeGen = lazy(() => import('./pages/dev/QRCodeGen'));
const SymmetricCrypto = lazy(() => import('./pages/security/SymmetricEncryption'));

const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">{t.loading}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Text Tools */}
            <Route path="/text/diff" element={<TextDiff />} />
            <Route path="/text/frequency" element={<WordFrequency />} />
            <Route path="/text/case" element={<CaseConverter />} />
            <Route path="/text/count" element={<WordCounter />} />
            <Route path="/text/lorem" element={<LoremIpsum />} />
            
            {/* Dev Tools */}
            <Route path="/dev/json" element={<JSONFormatter />} />
            <Route path="/dev/timestamp" element={<TimestampConverter />} />
            <Route path="/dev/mock" element={<MockDataGen />} />
            <Route path="/dev/base64" element={<Base64Tool />} />
            <Route path="/dev/qrcode" element={<QRCodeGen />} />
            
            {/* Security Tools */}
            <Route path="/security/password" element={<PasswordGen />} />
            <Route path="/security/symmetric" element={<SymmetricCrypto />} />
            
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
