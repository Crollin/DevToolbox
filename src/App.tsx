import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LicenceKeyHub from "./pages/tools/LicenceKeyHub";
import CsvPreviewPro from "./pages/tools/CsvPreviewPro";
import MonCalculEnergie from "./pages/tools/MonCalculEnergie";
import WPScriptLibrary from "./pages/tools/WPScriptLibrary";
import ColorPaletteGen from "./pages/tools/ColorPaletteGen";
import WPCLIGlossary from "./pages/tools/WPCLIGlossary";
import SVGIconLibrary from "./pages/tools/SVGIconLibrary";
import GitCommander from "./pages/tools/GitCommander";
import DockerCommander from "./pages/tools/DockerCommander";
import CodeSnippetLibrary from "./pages/tools/CodeSnippetLibrary";
import MarkdownEditor from "./pages/tools/MarkdownEditor";
import WPHookReference from "./pages/tools/WPHookReference";
import WPQueryBuilder from "./pages/tools/WPQueryBuilder";
import ImageResizer from "./pages/tools/ImageResizer";
import TaskReminder from "./pages/tools/TaskReminder";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/tools/licence-key-hub"
                element={
                  <ProtectedRoute>
                    <LicenceKeyHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/csv-preview-pro"
                element={
                  <ProtectedRoute>
                    <CsvPreviewPro />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/mon-calcul-energie"
                element={
                  <ProtectedRoute>
                    <MonCalculEnergie />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/wp-script-library"
                element={
                  <ProtectedRoute>
                    <WPScriptLibrary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/color-palette-gen"
                element={
                  <ProtectedRoute>
                    <ColorPaletteGen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/wpcli-glossary"
                element={
                  <ProtectedRoute>
                    <WPCLIGlossary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/svg-icon-library"
                element={
                  <ProtectedRoute>
                    <SVGIconLibrary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/git-commander"
                element={
                  <ProtectedRoute>
                    <GitCommander />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/docker-commander"
                element={
                  <ProtectedRoute>
                    <DockerCommander />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/code-snippet-library"
                element={
                  <ProtectedRoute>
                    <CodeSnippetLibrary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/wp-hook-reference"
                element={
                  <ProtectedRoute>
                    <WPHookReference />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/wp-query-builder"
                element={
                  <ProtectedRoute>
                    <WPQueryBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/markdown-editor"
                element={
                  <ProtectedRoute>
                    <MarkdownEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/image-resizer"
                element={
                  <ProtectedRoute>
                    <ImageResizer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools/task-reminder"
                element={
                  <ProtectedRoute>
                    <TaskReminder />
                  </ProtectedRoute>
                }
              />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
