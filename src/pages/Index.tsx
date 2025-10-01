import { Header } from "@/components/Header";
import { StoryCard } from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, BookOpen, Sparkles } from "lucide-react";

// Mock data for trending stories
const trendingStories = [
  {
    id: "1",
    title: "Gecənin Sükutu",
    excerpt: "Qaranlıq gecədə baş verən sirli hadisələr haqqında bir hekayə...",
    coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
    author: {
      name: "Aysel Məmmədova",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aysel",
    },
    tags: ["sirr", "gərginlik", "fantastika"],
    readTime: 12,
    views: 2543,
    publishedAt: "2024-03-15",
  },
  {
    id: "2",
    title: "Dənizin Səsi",
    excerpt: "Sahil kənarında yaşayan gənc qızın həyatında baş verən dəyişikliklər...",
    coverImage: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
    author: {
      name: "Rəşad Əliyev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rashad",
    },
    tags: ["romantika", "dram", "həyat"],
    readTime: 8,
    views: 1876,
    publishedAt: "2024-03-14",
  },
  {
    id: "3",
    title: "Son Yarpaq",
    excerpt: "Payızın son günlərində baş verən unudulmaz görüş haqqında hekayə...",
    coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    author: {
      name: "Gülnar İbrahimova",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnar",
    },
    tags: ["payız", "romantika", "təbiət"],
    readTime: 15,
    views: 3241,
    publishedAt: "2024-03-13",
  },
];

const recentStories = [
  {
    id: "4",
    title: "Yolların Kəsişməsi",
    excerpt: "İki dostun həyat yollarının təsadüfən kəsişməsi və nəticələri...",
    coverImage: "https://images.unsplash.com/photo-1476357471311-43c0db9fb2b4?w=800&q=80",
    author: {
      name: "Elçin Həsənov",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elchin",
    },
    tags: ["dostluq", "həyat", "səyahət"],
    readTime: 10,
    views: 1234,
    publishedAt: "2024-03-16",
  },
  {
    id: "5",
    title: "Xatirələr Dəftəri",
    excerpt: "Köhnə bir dəftərdə tapılan xatirələr və onların sirləri...",
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    author: {
      name: "Səbinə Quliyeva",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sabina",
    },
    tags: ["xatirə", "sirr", "nostalji"],
    readTime: 7,
    views: 987,
    publishedAt: "2024-03-16",
  },
  {
    id: "6",
    title: "Ulduzlar Altında",
    excerpt: "Gecə səmasına baxarkən düşünülən fəlsəfi mülahizələr...",
    coverImage: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80",
    author: {
      name: "Tural Nəbiyev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tural",
    },
    tags: ["fəlsəfə", "gecə", "düşüncə"],
    readTime: 6,
    views: 1543,
    publishedAt: "2024-03-15",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-muted/50 to-background py-16">
          <div className="container px-4 text-center">
            <h1 className="mb-4 text-5xl font-bold text-secondary md:text-6xl">
              Hekayələrinizi Paylaşın
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Yaradıcılığınızı kəşf edin, hekayələrinizi yazın və minlərlə oxucu ilə paylaşın
            </p>
            <Button size="lg" className="shadow-inkora transition-inkora hover:shadow-inkora-lg">
              <BookOpen className="mr-2 h-5 w-5" />
              Yazmağa Başla
            </Button>
          </div>
        </section>

        {/* Trending Stories */}
        <section className="py-16">
          <div className="container px-4">
            <div className="mb-8 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Ən Çox Oxunanlar</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trendingStories.map((story) => (
                <StoryCard key={story.id} {...story} />
              ))}
            </div>
          </div>
        </section>

        {/* Recent Stories */}
        <section className="border-t bg-muted/20 py-16">
          <div className="container px-4">
            <div className="mb-8 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-secondary" />
              <h2 className="text-3xl font-bold">Son Hekayələr</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentStories.map((story) => (
                <StoryCard key={story.id} {...story} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-16">
          <div className="container px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Sizin Hekayəniz Nədir?</h2>
            <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
              Yaradıcı yazıçılar icması ilə birləşin və öz hekayələrinizi dünya ilə paylaşın
            </p>
            <Button size="lg" variant="secondary">
              İndi Qoşul
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Inkora. Bütün hüquqlar qorunur.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
