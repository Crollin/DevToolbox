import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { WPQueryConfig } from "@/types/wpquery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QueryPreviewProps {
  config: WPQueryConfig;
}

const QueryPreview = ({ config }: QueryPreviewProps) => {
  const [copied, setCopied] = useState(false);

  const generatePHPCode = (): string => {
    const args: string[] = [];

    if (config.post_type && config.post_type.length > 0) {
      if (config.post_type.length === 1) {
        args.push(`'post_type' => '${config.post_type[0]}'`);
      } else {
        args.push(`'post_type' => array(${config.post_type.map((t) => `'${t}'`).join(", ")})`);
      }
    }

    if (config.post_status && config.post_status.length > 0) {
      if (config.post_status.length === 1) {
        args.push(`'post_status' => '${config.post_status[0]}'`);
      } else {
        args.push(`'post_status' => array(${config.post_status.map((s) => `'${s}'`).join(", ")})`);
      }
    }

    if (config.posts_per_page !== undefined) {
      args.push(`'posts_per_page' => ${config.posts_per_page}`);
    }

    if (config.offset !== undefined) {
      args.push(`'offset' => ${config.offset}`);
    }

    if (config.paged !== undefined) {
      args.push(`'paged' => ${config.paged}`);
    }

    if (config.orderby) {
      args.push(`'orderby' => '${config.orderby}'`);
    }

    if (config.order) {
      args.push(`'order' => '${config.order}'`);
    }

    if (config.meta_key) {
      args.push(`'meta_key' => '${config.meta_key}'`);
    }

    if (config.meta_value) {
      args.push(`'meta_value' => '${config.meta_value}'`);
    }

    if (config.meta_query && config.meta_query.length > 0) {
      const metaQueries = config.meta_query.map((mq) => {
        const metaArgs: string[] = [`'key' => '${mq.key}'`];
        if (mq.value) {
          metaArgs.push(`'value' => '${mq.value}'`);
        }
        metaArgs.push(`'compare' => '${mq.compare}'`);
        if (mq.type) {
          metaArgs.push(`'type' => '${mq.type}'`);
        }
        return `array(${metaArgs.join(", ")})`;
      });
      args.push(`'meta_query' => array(${metaQueries.join(", ")})`);
    }

    if (config.tax_query && config.tax_query.length > 0) {
      const taxQueries = config.tax_query.map((tq) => {
        const taxArgs: string[] = [
          `'taxonomy' => '${tq.taxonomy}'`,
          `'field' => '${tq.field}'`,
          `'terms' => array(${tq.terms.map((t) => `'${t}'`).join(", ")})`,
          `'operator' => '${tq.operator}'`,
        ];
        return `array(${taxArgs.join(", ")})`;
      });
      args.push(`'tax_query' => array(${taxQueries.join(", ")})`);
    }

    if (config.author !== undefined) {
      if (Array.isArray(config.author)) {
        args.push(`'author' => array(${config.author.join(", ")})`);
      } else {
        args.push(`'author' => ${config.author}`);
      }
    }

    if (config.author_name) {
      args.push(`'author_name' => '${config.author_name}'`);
    }

    if (config.search) {
      args.push(`'s' => '${config.search}'`);
    }

    if (config.post__in && config.post__in.length > 0) {
      args.push(`'post__in' => array(${config.post__in.join(", ")})`);
    }

    if (config.post__not_in && config.post__not_in.length > 0) {
      args.push(`'post__not_in' => array(${config.post__not_in.join(", ")})`);
    }

    const argsString = args.length > 0 ? `\n    ${args.join(",\n    ")}\n` : "";

    return `$args = array(${argsString});

$query = new WP_Query($args);

if ($query->have_posts()) {
    while ($query->have_posts()) {
        $query->the_post();
        // Votre code ici
        the_title();
        the_content();
    }
    wp_reset_postdata();
}`;
  };

  const phpCode = generatePHPCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(phpCode);
    setCopied(true);
    toast({ title: "Code PHP copié" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prévisualisation PHP</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copié
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copier
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="text-xs sm:text-sm font-mono bg-muted p-4 rounded border border-border overflow-x-auto">
          <code>{phpCode}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default QueryPreview;


