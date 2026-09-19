<?php

namespace Tests\Feature;

use App\Domain\Businesses\Models\Business;
use App\Domain\Users\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesUsers;
use Tests\TestCase;

class UserBusinessAssignmentTest extends TestCase
{
    use CreatesUsers, RefreshDatabase;

    public function test_admin_can_create_a_business_user_assigned_to_a_business(): void
    {
        $admin = $this->superAdmin();
        $business = Business::factory()->create();

        $this->actingAs($admin)
            ->post('/admin/users', [
                'name' => 'Rosa Castellanoss',
                'email' => 'rosa@example.com',
                'job_title' => 'Gerente',
                'status' => 'active',
                'password' => 'StrongPass123',
                'password_confirmation' => 'StrongPass123',
                'roles' => [RoleEnum::BusinessUser->value],
                'business_id' => $business->id,
            ])
            ->assertRedirect();

        $user = User::query()->where('email', 'rosa@example.com')->firstOrFail();

        $this->assertTrue($user->hasRole(RoleEnum::BusinessUser));
        $this->assertDatabaseHas('business_users', [
            'user_id' => $user->id,
            'business_id' => $business->id,
            'is_primary' => true,
        ]);

        // The assigned user can reach the business dashboard.
        $this->actingAs($user->fresh())->get('/business/dashboard')->assertOk();
    }

    public function test_business_role_requires_a_business(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin)
            ->post('/admin/users', [
                'name' => 'Sin Negocio',
                'email' => 'sin-negocio@example.com',
                'status' => 'active',
                'password' => 'StrongPass123',
                'password_confirmation' => 'StrongPass123',
                'roles' => [RoleEnum::BusinessUser->value],
            ])
            ->assertSessionHasErrors('business_id');

        $this->assertDatabaseMissing('users', ['email' => 'sin-negocio@example.com']);
    }

    public function test_changing_roles_to_staff_removes_the_business_membership(): void
    {
        $admin = $this->superAdmin();
        $business = Business::factory()->create();
        $user = $this->businessUser($business);

        $this->assertDatabaseHas('business_users', ['user_id' => $user->id]);

        $this->actingAs($admin)
            ->put("/admin/users/{$user->id}", [
                'name' => $user->name,
                'email' => $user->email,
                'job_title' => 'Operador',
                'status' => 'active',
                'password' => '',
                'password_confirmation' => '',
                'roles' => [RoleEnum::Operator->value],
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('business_users', ['user_id' => $user->id]);
    }
}
