import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Prehled from "./pages/Prehled";
import Plany from "./pages/Plany";
import NovyPlan from "./pages/NovyPlan";
import DetailPlanu from "./pages/DetailPlanu";
import DetailCile from "./pages/DetailCile";
import Archy from "./pages/Archy";
import DetailArchu from "./pages/DetailArchu";
import Zaci from "./pages/Zaci";
import DetailZaka from "./pages/DetailZaka";
import Hodnoceni from "./pages/Hodnoceni";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Prehled /> },
      { path: "plany", element: <Plany /> },
      { path: "plany/novy", element: <NovyPlan /> },
      { path: "plany/:planId", element: <DetailPlanu /> },
      { path: "cile/:cilId", element: <DetailCile /> },
      { path: "archy", element: <Archy /> },
      { path: "archy/:archId", element: <DetailArchu /> },
      { path: "zaci", element: <Zaci /> },
      { path: "zaci/:zakId", element: <DetailZaka /> },
      { path: "zaci/:zakId/hodnoceni", element: <Hodnoceni /> },
    ],
  },
]);
