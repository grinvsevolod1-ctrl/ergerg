'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { GitCommit, GitPullRequest, MessageSquare } from 'lucide-react'

interface ContributorCardProps {
  username: string
  avatarUrl?: string | null
  totalCommits: number
  totalPrs: number
  totalReviews: number
  repositoriesCount: number
  lastActivity?: string | null
}

export function ContributorCard({
  username,
  avatarUrl,
  totalCommits,
  totalPrs,
  totalReviews,
  repositoriesCount,
  lastActivity
}: ContributorCardProps) {
  const initials = username
    .split(/[._-]/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl || undefined} alt={username} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{username}</h3>
              <Badge variant="secondary" className="text-xs">
                {repositoriesCount} {repositoriesCount === 1 ? 'repo' : 'repos'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <GitCommit className="h-3.5 w-3.5" />
                <span>{totalCommits}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitPullRequest className="h-3.5 w-3.5" />
                <span>{totalPrs}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{totalReviews}</span>
              </div>
            </div>
            {lastActivity && (
              <p className="text-xs text-muted-foreground mt-2">
                Last active: {new Date(lastActivity).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
