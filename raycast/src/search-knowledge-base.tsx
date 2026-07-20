import {
  Action,
  ActionPanel,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  KnowledgeEntry,
  listKnowledgeEntries,
  markKnowledgeEntryOpened,
} from "./kb-api";

export default function SearchKnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function load(query?: string) {
    setIsLoading(true);
    setError(undefined);
    try {
      setEntries(await listKnowledgeEntries(query));
    } catch (caught) {
      setError(String(caught));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function openEntry(entry: KnowledgeEntry) {
    try {
      await markKnowledgeEntryOpened(entry.id);
    } catch {
      // L'ouverture reste possible même si le suivi échoue.
    }
  }

  if (error) {
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="API indisponible"
          description={error}
          actions={
            <ActionPanel>
              <Action
                title="Réessayer"
                icon={Icon.RotateClockwise}
                onAction={() => load()}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={load}
      throttle
      searchBarPlaceholder="Rechercher une note, un lien ou un tag..."
    >
      {entries.map((entry) => (
        <List.Item
          key={entry.id}
          title={entry.title}
          subtitle={
            entry.summary ||
            entry.url ||
            entry.tags.map((tag) => tag.name).join(", ")
          }
          accessories={entry.isFavorite ? [{ icon: Icon.Star }] : undefined}
          actions={
            <ActionPanel>
              {entry.url && (
                <Action.OpenInBrowser
                  title="Ouvrir l'entrée"
                  url={entry.url}
                  onOpen={() => openEntry(entry)}
                />
              )}
              {entry.content && (
                <Action.CopyToClipboard
                  title="Copier le contenu"
                  content={entry.content}
                  concealed={false}
                />
              )}
              {entry.url && (
                <Action.CopyToClipboard
                  title="Copier le lien"
                  content={entry.url}
                />
              )}
              <Action
                title="Marquer comme ouverte"
                icon={Icon.Eye}
                onAction={() =>
                  showToast({
                    style: Toast.Style.Success,
                    title: "Entrée ouverte",
                  }).then(() => openEntry(entry))
                }
              />
              <Action
                title="Actualiser"
                icon={Icon.RotateClockwise}
                onAction={() => load()}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && entries.length === 0 && (
        <List.EmptyView
          title="Aucune entrée"
          description="Aucune note ne correspond à votre recherche."
        />
      )}
    </List>
  );
}
