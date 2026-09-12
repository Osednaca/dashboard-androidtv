<?php

namespace Database\Seeders;

use App\Domain\Users\Enums\PermissionEnum;
use App\Domain\Users\Enums\RoleEnum;
use App\Domain\Users\Models\Permission;
use App\Domain\Users\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (PermissionEnum::cases() as $permission) {
            Permission::query()->updateOrCreate(
                ['name' => $permission->value],
                ['label' => $permission->label(), 'group' => $permission->group()],
            );
        }

        foreach (RoleEnum::cases() as $roleEnum) {
            $role = Role::query()->updateOrCreate(
                ['name' => $roleEnum->value],
                ['label' => $roleEnum->label(), 'is_system' => true],
            );

            $ids = Permission::query()
                ->whereIn('name', $roleEnum->permissionValues())
                ->pluck('id');

            $role->permissions()->sync($ids);
        }

        $accounts = [
            ['name' => 'Valentina Ríos', 'email' => 'admin@signagetv.co', 'job_title' => 'Directora de operaciones', 'roles' => [RoleEnum::SuperAdmin->value]],
            ['name' => 'Andrés Gómez', 'email' => 'operaciones@signagetv.co', 'job_title' => 'Operador de red', 'roles' => [RoleEnum::Operator->value]],
            ['name' => 'Laura Martínez', 'email' => 'campanas@signagetv.co', 'job_title' => 'Gestora de campañas', 'roles' => [RoleEnum::CampaignManager->value]],
            ['name' => 'Carlos Peña', 'email' => 'soporte@signagetv.co', 'job_title' => 'Soporte técnico', 'roles' => [RoleEnum::Support->value]],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'job_title' => $account['job_title'],
                    'password' => 'password',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ],
            );

            $user->syncRoles($account['roles']);
        }
    }
}
