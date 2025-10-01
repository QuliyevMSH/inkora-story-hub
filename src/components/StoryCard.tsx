import { Link } from "react-router-dom";
import { Clock, Eye, BookOpen } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoryCardProps {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
  };
  tags: string[];
  readTime: number;
  views: number;
  publishedAt: string;
}

export const StoryCard = ({
  id,
  title,
  excerpt,
  coverImage,
  author,
  tags,
  readTime,
  views,
  publishedAt,
}: StoryCardProps) => {
  return (
    <Card className="group overflow-hidden transition-inkora hover:shadow-inkora-lg">
      <Link to={`/story/${id}`}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-secondary/90 text-secondary-foreground backdrop-blur-sm"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/story/${id}`}>
          <h3 className="mb-2 line-clamp-2 text-xl font-bold transition-colors hover:text-primary">
            {title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-4">
        <Link
          to={`/author/${author.name}`}
          className="flex items-center gap-2 transition-inkora hover:opacity-80"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{author.name}</span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{views.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{readTime} dəq</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
