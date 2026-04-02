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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const LicenceKeyHub = lazy(() => import("./pages/tools/LicenceKeyHub"));
const CsvPreviewPro = lazy(() => import("./pages/tools/CsvPreviewPro"));
const MonCalculEnergie = lazy(() => import("./pages/tools/MonCalculEnergie"));
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
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tools/licence-key-hub" element={<LicenceKeyHub />} />
                <Route path="/tools/csv-preview-pro" element={<CsvPreviewPro />} />
                <Route path="/tools/mon-calcul-energie" element={<MonCalculEnergie />} />
                <Route path="/tools/wp-script-library" element={<WPScriptLibrary />} />
                <Route path="/tools/color-palette-gen" element={<ColorPaletteGen />} />
                <Route path="/tools/wpcli-glossary" element={<WPCLIGlossary />} />
                <Route path="/tools/svg-icon-library" element={<SVGIconLibrary />} />
                <Route path="/tools/git-commander" element={<GitCommander />} />
                <Route path="/tools/docker-commander" element={<DockerCommander />} />
                <Route path="/tools/code-snippet-library" element={<CodeSnippetLibrary />} />
                <Route path="/tools/wp-hook-reference" element={<WPHookReference />} />
                <Route path="/tools/wp-query-builder" element={<WPQueryBuilder />} />
                <Route path="/tools/markdown-editor" element={<MarkdownEditor />} />
                <Route path="/tools/image-resizer" element={<ImageResizer />} />
                <Route path="/tools/task-reminder" element={<TaskReminder />} />
                <Route path="/tools/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/tools/knowledge-base/new" element={<KnowledgeBase />} />
                <Route path="/account" element={<Account />} />
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
