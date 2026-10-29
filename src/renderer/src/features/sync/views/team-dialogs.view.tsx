import type { FormEvent, ReactElement } from 'react'
import type { useTeamDialogsViewModel } from '@/features/sync/viewmodels/use-team-dialogs.viewmodel'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

type ViewModel = ReturnType<typeof useTeamDialogsViewModel>

export function CreateWorkspaceDialogView({ createWorkspace }: { createWorkspace: ViewModel['createWorkspace'] }): ReactElement {
  return (
    <Dialog open={createWorkspace.open} onOpenChange={createWorkspace.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{createWorkspace.title}</DialogTitle>
          <DialogDescription>{createWorkspace.description}</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={(event: FormEvent) => void createWorkspace.onSubmit(event)}>
          <Label htmlFor="cloud-workspace-name">{createWorkspace.nameLabel}</Label>
          {/* biome-ignore lint/a11y/noAutofocus: the new-workspace dialog opens with the name field focused */}
          <Input
            id="cloud-workspace-name"
            autoFocus
            required
            maxLength={100}
            value={createWorkspace.name}
            onChange={(event) => createWorkspace.onNameChange(event.target.value)}
            placeholder={createWorkspace.namePlaceholder}
          />
          <Button type="submit" disabled={!createWorkspace.canSubmit}>
            {createWorkspace.submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TeamDialogView({ team }: { team: ViewModel['team'] }): ReactElement {
  return (
    <Dialog open={team.open} onOpenChange={team.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team.title}</DialogTitle>
          <DialogDescription>{team.description}</DialogDescription>
        </DialogHeader>
        <div className="dialog-form">
          {team.isOwner && (
            <>
              <p className="invite-help">{team.singleUseText}</p>
              <Label htmlFor="invite-email">{team.emailLabel}</Label>
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                required
                value={team.email}
                onChange={(event) => team.onEmailChange(event.target.value)}
                placeholder={team.emailPlaceholder}
              />
              <Label htmlFor="invite-role">{team.roleLabel}</Label>
              <Select value={team.role} onValueChange={team.onRoleChange}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {team.roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={team.onSend}>
                {team.sendLabel}
              </Button>
            </>
          )}
          {team.inviteLink && (
            <div className="invite-link-row">
              <Input aria-label={team.linkLabel} readOnly value={team.inviteLink} />
              <Button type="button" variant="outline" onClick={team.onCopy}>
                {team.copyLabel}
              </Button>
            </div>
          )}
          <form className="invite-accept-form" onSubmit={(event: FormEvent) => void team.onAccept(event)}>
            <Label htmlFor="invite-token">{team.acceptLabel}</Label>
            <Input
              id="invite-token"
              value={team.token}
              onChange={(event) => team.onTokenChange(event.target.value)}
              placeholder={team.tokenPlaceholder}
            />
            <Button type="submit" variant="outline" disabled={!team.canAccept}>
              {team.joinLabel}
            </Button>
          </form>
          {team.error && (
            <p className="dialog-error" role="status">
              {team.error}
            </p>
          )}
          {team.notice && (
            <p className="dialog-success" role="status">
              {team.notice}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
