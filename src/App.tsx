import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/tools/markdown-editor" element={<MarkdownEditor />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
