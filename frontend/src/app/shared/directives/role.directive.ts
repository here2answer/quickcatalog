import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;

  private readonly roleHierarchy: Record<string, number> = {
    OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1,
  };

  @Input() set appHasRole(requiredRole: string) {
    const user = this.authService.user();
    const userLevel = user ? (this.roleHierarchy[user.role] ?? 0) : 0;
    const requiredLevel = this.roleHierarchy[requiredRole] ?? 0;
    const hasPermission = userLevel >= requiredLevel;

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
