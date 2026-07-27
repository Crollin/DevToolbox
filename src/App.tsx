import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSyncFromUser } from "@/components/ThemeSyncFromUser";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ResetPasswordHandler } from "@/components/auth/ResetPasswordHandler";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const LicenceKeyHub = lazy(() => import("./pages/tools/LicenceKeyHub"));
const CsvPreviewPro = lazy(() => import("./pages/tools/CsvPreviewPro"));
const WPScriptLibrary = lazy(() => import("./pages/tools/WPScriptLibrary"));
const ColorPaletteGen = lazy(() => import("./pages/tools/ColorPaletteGen"));
const WPCLIGlossary = lazy(() => import("./pages/tools/WPCLIGlossary"));
const SVGIconLibrary = lazy(() => import("./pages/tools/SVGIconLibrary"));
const GitCommander = lazy(() => import("./pages/tools/GitCommander"));
const DockerCommander = lazy(() => import("./pages/tools/DockerCommander"));
const CodeSnippetLibrary = lazy(() => import("./pages/tools/CodeSnippetLibrary"));
const MarkdownEditor = lazy(() => import("./pages/tools/MarkdownEditor"));
const WPHookReference = lazy(() => import("./pages/tools/WPHookReference"));
const WPQueryBuilder = lazy(() => import("./pages/tools/WPQueryBuilder"));
const ImageResizer = lazy(() => import("./pages/tools/ImageResizer"));
const TaskReminder = lazy(() => import("./pages/tools/TaskReminder"));
const KnowledgeBase = lazy(() => import("./pages/tools/KnowledgeBase"));
const WPConfigGenerator = lazy(() => import("./pages/tools/WPConfigGenerator"));
const PluginHeaderBuilder = lazy(() => import("./pages/tools/PluginHeaderBuilder"));
const Account = lazy(() => import("./pages/Account"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <p className="text-muted-foreground">Chargement...</p>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeSyncFromUser />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <GlobalSearch />
              <ResetPasswordHandler />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tools/licence-key-hub" element={<ProtectedRoute><LicenceKeyHub /></ProtectedRoute>} />
                <Route path="/tools/csv-preview-pro" element={<ProtectedRoute><CsvPreviewPro /></ProtectedRoute>} />
                <Route path="/tools/wp-script-library" element={<ProtectedRoute><WPScriptLibrary /></ProtectedRoute>} />
                <Route path="/tools/color-palette-gen" element={<ProtectedRoute><ColorPaletteGen /></ProtectedRoute>} />
                <Route path="/tools/wpcli-glossary" element={<ProtectedRoute><WPCLIGlossary /></ProtectedRoute>} />
                <Route path="/tools/svg-icon-library" element={<ProtectedRoute><SVGIconLibrary /></ProtectedRoute>} />
                <Route path="/tools/git-commander" element={<ProtectedRoute><GitCommander /></ProtectedRoute>} />
                <Route path="/tools/docker-commander" element={<ProtectedRoute><DockerCommander /></ProtectedRoute>} />
                <Route path="/tools/code-snippet-library" element={<ProtectedRoute><CodeSnippetLibrary /></ProtectedRoute>} />
                <Route path="/tools/wp-hook-reference" element={<ProtectedRoute><WPHookReference /></ProtectedRoute>} />
                <Route path="/tools/wp-query-builder" element={<ProtectedRoute><WPQueryBuilder /></ProtectedRoute>} />
                <Route path="/tools/markdown-editor" element={<ProtectedRoute><MarkdownEditor /></ProtectedRoute>} />
                <Route path="/tools/image-resizer" element={<ProtectedRoute><ImageResizer /></ProtectedRoute>} />
                <Route path="/tools/task-reminder" element={<ProtectedRoute><TaskReminder /></ProtectedRoute>} />
                <Route path="/tools/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
                <Route path="/tools/knowledge-base/new" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
                <Route path="/tools/wp-config-generator" element={<ProtectedRoute><WPConfigGenerator /></ProtectedRoute>} />
                <Route path="/tools/plugin-header-builder" element={<ProtectedRoute><PluginHeaderBuilder /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
