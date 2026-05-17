'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, GitCommit, GitPullRequest, Users } from 'lucide-react'

interface RepositoryCardProps {
  name: string
  description?: string | null
  url?: string | null
  defaultBranch?: string
  totalCommits: number
  totalPrs: number
  totalPrsMerged: number
  contributorsCount: number
  lastActivity?: string | null
}

export function RepositoryCard({
  name,
  description,
  url,
  defaultBranch = 'main',
  totalCommits,
  totalPrs,
  totalPrsMerged,
  contributorsCount,
  lastActivity
}: RepositoryCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {name}
                </a>
              ) : (
                name
              )}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            {defaultBranch}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitCommit className="h-4 w-4" />
            <span>{totalCommits} commits</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitPullRequest className="h-4 w-4" />
            <span>
              {totalPrsMerged}/{totalPrs} PRs merged
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{contributorsCount} contributors</span>
          </div>
          {lastActivity && (
            <div className="text-muted-foreground">
              Last: {new Date(lastActivity).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
