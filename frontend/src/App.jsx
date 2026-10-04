import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import Loading from "./components/Loading";
import RequireRole from "./components/RequireRole";
import MovieList from "./pages/MovieList";

// The home page loads straight away; every other page downloads only when it is first opened,
// so customers never download the admin pages.
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const BookSeats = lazy(() => import("./pages/BookSeats"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Theatres = lazy(() => import("./pages/admin/Theatres"));
const TheatreShows = lazy(() => import("./pages/admin/TheatreShows"));
const Movies = lazy(() => import("./pages/admin/Movies"));

const App = () => {
  const location = useLocation();

  return (
    <>
      <Header />
      <main className="container page">
        {/* The key resets the error screen when the user moves to another page. */}
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<MovieList />} />
              <Route path="/movies/:movieId" element={<MovieDetails />} />
              <Route path="/movies/:movieId/shows/:showId" element={<BookSeats />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route element={<RequireRole role="user" />}>
                <Route path="/bookings" element={<MyBookings />} />
              </Route>

              <Route element={<RequireRole role="admin" />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/theatres" element={<Theatres />} />
                <Route path="/admin/theatres/:theatreId" element={<TheatreShows />} />
                <Route path="/admin/movies" element={<Movies />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
};

export default App;
