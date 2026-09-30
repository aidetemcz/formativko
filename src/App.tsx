import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LESSONS_ENABLED } from "@/config/features";
import { LegacyRedirect } from "@/components/LegacyRedirect";

const Login = lazy(() => import("./pages/Login"));
const Uvod = lazy(() => import("./pages/Uvod"));
const PredmetPlany = lazy(() => import("./pages/PredmetPlany"));
const PlanDetail = lazy(() => import("./pages/PlanDetail"));
const ClassDetail = lazy(() => import("./pages/ClassDetail"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const LessonPrint = lazy(() => import("./pages/LessonPrint"));
const Dukazy = lazy(() => import("./pages/Dukazy"));
const Napady = lazy(() => import("./pages/Napady"));
const Nastaveni = lazy(() => import("./pages/Nastaveni"));
const SebehodnoceniVerejne = lazy(() => import("./pages/SebehodnoceniVerejne"));
const A02CreateStudentProfiles = lazy(() => import("./pages/A02CreateStudentProfiles"));
const A03CreateClass = lazy(() => import("./pages/A03CreateClass"));
const A04EditClass = lazy(() => import("./pages/A04EditClass"));
const B01StudentProfiles = lazy(() => import("./pages/B01StudentProfiles"));
const B02StudentProfileDetail = lazy(() => import("./pages/B02StudentProfileDetail"));
const B03aProofOfLearningDetailText = lazy(() => import("./pages/B03aProofOfLearningDetailText"));
const B03bProofOfLearningDetailFile = lazy(() => import("./pages/B03bProofOfLearningDetailFile"));
const B04AddProofOfLearning = lazy(() => import("./pages/B04AddProofOfLearning"));
const C01Evaluations = lazy(() => import("./pages/C01Evaluations"));
const C02aCreateEvaluationDraft = lazy(() => import("./pages/C02aCreateEvaluationDraft"));
const C02bCreateEvaluationDraft = lazy(() => import("./pages/C02bCreateEvaluationDraft"));
const C03EditEvaluationDrafts = lazy(() => import("./pages/C03EditEvaluationDrafts"));
const D01Lessons = lazy(() => import("./pages/D01Lessons"));
const D02CreateLesson = lazy(() => import("./pages/D02CreateLesson"));
const F01Classes = lazy(() => import("./pages/F01Classes"));
const E01CaptureToolChooseClass = lazy(() => import("./pages/E01CaptureToolChooseClass"));
const E02CaptureToolAddProofs = lazy(() => import("./pages/E02CaptureToolAddProofs"));
const G01Goals = lazy(() => import("./pages/G01Goals"));
const G02GoalDetail = lazy(() => import("./pages/G02GoalDetail"));
const G03CreateGoal = lazy(() => import("./pages/G03CreateGoal"));
const H01Subjects = lazy(() => import("./pages/H01Subjects"));
const H02CreateSubject = lazy(() => import("./pages/H02CreateSubject"));
const NotFound = lazy(() => import("./pages/NotFound"));
const K01Courses = lazy(() => import("./pages/K01Courses"));
const K02CreateCourse = lazy(() => import("./pages/K02CreateCourse"));
const K03CourseDetail = lazy(() => import("./pages/K03CourseDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes — avoid redundant refetches on navigation
      gcTime: 10 * 60 * 1000,   // 10 minutes — keep unused data in cache longer
      retry: 1,                  // retry once on failure, then surface the error
      refetchOnWindowFocus: false, // classroom use: tabs stay open, don't refetch on every focus
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-muted-foreground">Načítání…</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* Public: pupils open this from a QR code, without an account. */}
              <Route path="/s/:token" element={<SebehodnoceniVerejne />} />

              {/* The new version's routes (zadání kap. 4.2). */}
              <Route path="/" element={<ProtectedRoute><Uvod /></ProtectedRoute>} />
              <Route path="/predmety" element={<ProtectedRoute><H01Subjects /></ProtectedRoute>} />
              <Route path="/predmety/:subjectId" element={<ProtectedRoute><PredmetPlany /></ProtectedRoute>} />
              <Route path="/plany/:courseId" element={<ProtectedRoute><PlanDetail /></ProtectedRoute>} />
              {/* The old course page, with goals made before lessons existed. */}
              <Route path="/plany/:courseId/prehled" element={<ProtectedRoute><K03CourseDetail /></ProtectedRoute>} />
              <Route path="/lekce/:lessonId" element={<ProtectedRoute><LessonDetail /></ProtectedRoute>} />
              {/* Recording in the lesson (zadání kap. 3), opened from the lesson. */}
              <Route path="/lekce/:lessonId/zaznam" element={<ProtectedRoute><E02CaptureToolAddProofs /></ProtectedRoute>} />
              {/* Printable sheet and exit tickets, without the app's menu. */}
              <Route path="/lekce/:lessonId/tisk/:kind" element={<ProtectedRoute><LessonPrint /></ProtectedRoute>} />
              <Route path="/tridy" element={<ProtectedRoute><F01Classes /></ProtectedRoute>} />
              <Route path="/tridy/:classId" element={<ProtectedRoute><ClassDetail /></ProtectedRoute>} />
              <Route path="/tridy/:classId/upravit" element={<ProtectedRoute><A04EditClass /></ProtectedRoute>} />
              <Route path="/zaci/:id" element={<ProtectedRoute><B02StudentProfileDetail /></ProtectedRoute>} />
              <Route path="/dukazy" element={<ProtectedRoute><Dukazy /></ProtectedRoute>} />
              <Route path="/napady" element={<ProtectedRoute><Napady /></ProtectedRoute>} />
              <Route path="/hodnoceni" element={<ProtectedRoute><C01Evaluations /></ProtectedRoute>} />
              <Route path="/hodnoceni/nove" element={<ProtectedRoute><C02aCreateEvaluationDraft /></ProtectedRoute>} />
              <Route path="/hodnoceni/nove/nahled" element={<ProtectedRoute><C02bCreateEvaluationDraft /></ProtectedRoute>} />
              <Route path="/hodnoceni/:id" element={<ProtectedRoute><C03EditEvaluationDrafts /></ProtectedRoute>} />
              <Route path="/nastaveni" element={<ProtectedRoute><Nastaveni /></ProtectedRoute>} />
              {/* The old stand-alone lesson pages stay off; lessons now live
                  in thematic plans (/plany/:id, /lekce/:id). */}
              {LESSONS_ENABLED && (
                <>
                  <Route path="/lessons" element={<ProtectedRoute><D01Lessons /></ProtectedRoute>} />
                  <Route path="/lessons/create" element={<ProtectedRoute><D02CreateLesson /></ProtectedRoute>} />
                  <Route path="/lessons/:lessonId" element={<LegacyRedirect to="/lekce/:lessonId" />} />
                  <Route path="/lessons/:lessonId/edit" element={<ProtectedRoute><D02CreateLesson /></ProtectedRoute>} />
                </>
              )}

              {/* Old addresses that have a new home. */}
              <Route path="/classes" element={<LegacyRedirect to="/tridy" />} />
              <Route path="/edit-class/:classId" element={<LegacyRedirect to="/tridy/:classId/upravit" />} />
              <Route path="/student-profiles/:id" element={<LegacyRedirect to="/zaci/:id" />} />
              <Route path="/evaluations" element={<LegacyRedirect to="/hodnoceni" />} />
              <Route path="/evaluations/create" element={<LegacyRedirect to="/hodnoceni/nove" />} />
              <Route path="/evaluations/create/preview" element={<LegacyRedirect to="/hodnoceni/nove/nahled" />} />
              <Route path="/evaluations/edit/:id" element={<LegacyRedirect to="/hodnoceni/:id" />} />
              <Route path="/subjects" element={<LegacyRedirect to="/predmety" />} />
              <Route path="/courses/:courseId" element={<LegacyRedirect to="/plany/:courseId" />} />

              {/* Screens of the old version that the new menu no longer lists.
                  They stay reachable from the pages that link to them until
                  their phase rebuilds them. */}
              <Route path="/create-student-profiles" element={<ProtectedRoute><A02CreateStudentProfiles /></ProtectedRoute>} />
              <Route path="/create-class" element={<ProtectedRoute><A03CreateClass /></ProtectedRoute>} />
              <Route path="/student-profiles" element={<ProtectedRoute><B01StudentProfiles /></ProtectedRoute>} />
              <Route path="/student-profiles/:id/proof/:proofId" element={<ProtectedRoute><B03aProofOfLearningDetailText /></ProtectedRoute>} />
              <Route path="/student-profiles/:id/proof-file/:proofId" element={<ProtectedRoute><B03bProofOfLearningDetailFile /></ProtectedRoute>} />
              <Route path="/student-profiles/:id/add-proof" element={<ProtectedRoute><B04AddProofOfLearning /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><G01Goals /></ProtectedRoute>} />
              <Route path="/goals/create" element={<ProtectedRoute><G03CreateGoal /></ProtectedRoute>} />
              <Route path="/goals/:goalId" element={<ProtectedRoute><G02GoalDetail /></ProtectedRoute>} />
              <Route path="/goals/:goalId/edit" element={<ProtectedRoute><G03CreateGoal /></ProtectedRoute>} />
              <Route path="/subjects/create" element={<ProtectedRoute><H02CreateSubject /></ProtectedRoute>} />
              <Route path="/subjects/:subjectId/edit" element={<ProtectedRoute><H02CreateSubject /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><K01Courses /></ProtectedRoute>} />
              <Route path="/courses/create" element={<ProtectedRoute><K02CreateCourse /></ProtectedRoute>} />
              <Route path="/courses/:courseId/edit" element={<ProtectedRoute><K02CreateCourse /></ProtectedRoute>} />
              <Route path="/capture" element={<ProtectedRoute><E01CaptureToolChooseClass /></ProtectedRoute>} />
              <Route path="/capture/:courseId" element={<ProtectedRoute><E02CaptureToolAddProofs /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
