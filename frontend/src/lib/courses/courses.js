// Mock Course repository for the Learning Hub. Isolated from the landing
// page's marketing preview data (components/landing/coursesData.js) — this
// is the catalogue Buy Courses/My Learning actually read from, structured
// to mirror the eventual Course table (id/title/description/category/
// instructor/thumbnail/price only — no enrollment-derived fields here).
export const COURSES = [
  { id: "python-foundations", title: "Python Foundations", description: "Start writing real Python from your first sitting.", category: "Programming", instructor: "A. Rao", thumbnail: null, price: 1499 },
  { id: "javascript-essentials", title: "JavaScript Essentials", description: "The language the whole web runs on, taught properly.", category: "Programming", instructor: "N. Iyer", thumbnail: null, price: 1499 },
  { id: "data-structures-algorithms", title: "Data Structures & Algorithms", description: "The reasoning behind efficient code, not just syntax.", category: "Computer Science", instructor: "S. Verma", thumbnail: null, price: 2499 },
  { id: "web-development-bootcamp", title: "Web Development Bootcamp", description: "Frontend to backend, one connected curriculum.", category: "Web Development", instructor: "P. Khan", thumbnail: null, price: 3499 },
  { id: "machine-learning-basics", title: "Machine Learning Basics", description: "The ideas behind the models, built from first principles.", category: "Data Science", instructor: "R. Mehta", thumbnail: null, price: 2999 },
  { id: "system-design-primer", title: "System Design Primer", description: "How large systems are actually put together.", category: "Computer Science", instructor: "S. Verma", thumbnail: null, price: 2999 },
  { id: "sql-for-everyone", title: "SQL for Everyone", description: "Query real data with confidence, no prior experience needed.", category: "Databases", instructor: "A. Rao", thumbnail: null, price: 999 },
  { id: "react-in-depth", title: "React in Depth", description: "Beyond tutorials — the patterns real applications use.", category: "Web Development", instructor: "N. Iyer", thumbnail: null, price: 1999 },
  { id: "linux-command-line", title: "Linux Command Line", description: "The terminal skills every developer eventually needs.", category: "Systems", instructor: "V. Nair", thumbnail: null, price: 999 },
  { id: "data-visualization", title: "Data Visualization", description: "Turn spreadsheets into stories people understand at a glance.", category: "Data Science", instructor: "R. Mehta", thumbnail: null, price: 1499 },
  { id: "cloud-fundamentals", title: "Cloud Fundamentals", description: "What actually happens when you deploy to the cloud.", category: "Systems", instructor: "V. Nair", thumbnail: null, price: 1999 },
  { id: "git-and-github", title: "Git & GitHub", description: "Version control that makes sense, not just commands to memorise.", category: "Tools", instructor: "P. Khan", thumbnail: null, price: 799 },
  { id: "api-design", title: "API Design", description: "Build interfaces other developers will actually enjoy using.", category: "Web Development", instructor: "N. Iyer", thumbnail: null, price: 1999 },
  { id: "statistics-for-data-science", title: "Statistics for Data Science", description: "The statistical foundation every ML course assumes you already have.", category: "Data Science", instructor: "R. Mehta", thumbnail: null, price: 1999 },
  { id: "mobile-app-development", title: "Mobile App Development", description: "Ship your first app to a real device.", category: "Mobile", instructor: "P. Khan", thumbnail: null, price: 2499 },
  { id: "computer-networks", title: "Computer Networks", description: "How data actually travels from one machine to another.", category: "Computer Science", instructor: "S. Verma", thumbnail: null, price: 1999 },
  { id: "docker-and-containers", title: "Docker & Containers", description: "Package software so it runs the same everywhere.", category: "Systems", instructor: "V. Nair", thumbnail: null, price: 1499 },
  { id: "typescript-fundamentals", title: "TypeScript Fundamentals", description: "Catch bugs before they ship, not after.", category: "Programming", instructor: "N. Iyer", thumbnail: null, price: 1499 },
  { id: "operating-systems", title: "Operating Systems", description: "What's really going on beneath every program you run.", category: "Computer Science", instructor: "S. Verma", thumbnail: null, price: 2499 },
  { id: "intro-to-cybersecurity", title: "Intro to Cybersecurity", description: "Think like an attacker to build better defences.", category: "Security", instructor: "A. Rao", thumbnail: null, price: 1999 },
  { id: "algorithms-in-practice", title: "Algorithms in Practice", description: "The classic problems, solved and explained end to end.", category: "Computer Science", instructor: "S. Verma", thumbnail: null, price: 2499 },
];

export function getCourseById(id) {
  return COURSES.find((course) => course.id === id) ?? null;
}
