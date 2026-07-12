import { Suspense, lazy, useEffect } from "react";
import "./global.css";
import loadingGIF from "./assets/loading.gif"
import fullLogo from "./assets/folderhost-logo.webp"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Cookies from "js-cookie";

const ExplorerPage = lazy(() => import('./pages/ExplorerPage/Explorer'));
const Home = lazy(() => import('./pages/HomePage/Home'));
const Login = lazy(() => import('./pages/LoginPage/Login'));
const CodeEditor = lazy(() => import('./pages/CodeEditorPage/CodeEditor'));
const NoPage = lazy(() => import('./pages/NoPage'));
const Recovery = lazy(() => import('./pages/Recovery/Recovery'));
const Users = lazy(() => import('./pages/Users/Users'));
const Logs = lazy(() => import('./pages/Logs/Logs'));
const Services = lazy(() => import('./pages/Services/Services'));
const ServiceManager = lazy(() => import('./pages/ServiceManager/ServiceManager'));
const NewUser = lazy(() => import('./pages/NewUser/NewUser'));
const EditUser = lazy(() => import('./pages/EditUser/EditUser'));
const SharePage = lazy(() => import('./pages/SharePage/SharePage'));
const Default = lazy(() => import('./components/templates/Default'));

function App() {
  useEffect(() => {
    const cookiesToRenew = [
        "show-disabled",
        "mode", 
        "disable-caching",
        "editor-fontsize",
        "editor-minimap"
      ];

    cookiesToRenew.forEach(cookieKey => {
      const cookieValue = Cookies.get(cookieKey)

      if (cookieValue) {
        Cookies.set(cookieKey, cookieValue, {
          expires: 7
        })
      }
    });
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={

        <div className="flex flex-col justify-center items-center bg-gray-800 p-2">
          <img src={fullLogo} alt="logo" width={200} />
          <div className="flex justify-center items-center">
            <img src={loadingGIF} width={50} alt="loading gif" />
            <h1 className="text-2xl">Loading</h1>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/">
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="explorer">
              <Route index element={<Default><NoPage /></Default>} />
              <Route path=":path" element={<Default><ExplorerPage /></Default>} />
            </Route>
            <Route path="recovery">
              <Route index element={<Default><Recovery /></Default>} />
            </Route>
            <Route path="users">
              <Route index element={<Default><Users /></Default>} />
              <Route path=":username" element={<Default><EditUser /></Default>} />
              <Route path="new" element={<Default><NewUser /></Default>} />
            </Route>
            <Route path="logs">
              <Route index element={<Default><Logs /></Default>} />
            </Route>
            <Route path="services">
              <Route index element={<Default><Services /></Default>} />
              <Route path=":service" element={<Default><ServiceManager /></Default>} />
            </Route>
            <Route path="editor">
              <Route index element={<NoPage />} />
              <Route path=":path" element={<CodeEditor />} />
            </Route>
            <Route path="share">
              <Route index element={<NoPage />} />
              <Route path=":id" element={<SharePage />} />
            </Route>
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
