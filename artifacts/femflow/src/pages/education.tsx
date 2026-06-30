import { useListArticles } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";

export default function Education() {
  const { data: articles = [] } = useListArticles();

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className="text-2xl font-serif font-bold text-foreground">Knowledge Center</h1>
      
      <div className="space-y-4">
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No articles available.</p>
        ) : (
          articles.map(a => (
            <Card key={a.id} className="p-4 overflow-hidden group hover:border-primary transition-colors cursor-pointer">
              {a.imageUrl && (
                <div className="w-full h-32 bg-secondary rounded-lg mb-3 overflow-hidden">
                  <img src={a.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md mb-2">
                {a.category}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{a.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{a.summary}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}