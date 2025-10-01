import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Write from "./pages/Write";
import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";
import StoryDetail from "./pages/StoryDetail";
import StoryEditor from "./pages/StoryEditor";
import ChapterRead from "./pages/ChapterRead";
import SingleStoryRead from "./pages/SingleStoryRead";
import SingleStoryEdit from "./pages/SingleStoryEdit";
import StoryMetadataEdit from "./pages/StoryMetadataEdit";
import ChapterEdit from "./pages/ChapterEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/write" element={<Write />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/story/:id" element={<StoryDetail />} />
          <Route path="/story/:id/write" element={<StoryEditor />} />
          <Route path="/story/:id/read" element={<SingleStoryRead />} />
          <Route path="/story/:id/edit" element={<SingleStoryEdit />} />
          <Route path="/story/:id/edit-metadata" element={<StoryMetadataEdit />} />
          <Route path="/story/:storyId/chapter/:chapterId" element={<ChapterRead />} />
          <Route path="/story/:storyId/chapter/:chapterId/edit" element={<ChapterEdit />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
