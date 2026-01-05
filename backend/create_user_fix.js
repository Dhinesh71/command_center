const supabase = require('./config/supabaseClient');

const email = '6ixmindslabs@gmail.com';
const password = '6@Minds^Labs';
const fullName = '6ixminds Labs';

const createAdmin = async () => {
    console.log(`Attempting to create/update user: ${email}`);

    // Try to create the user
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: 'admin'
        }
    });

    if (error) {
        console.log('Error creating user:', error.message);

        // If user already exists, try to update password
        if (error.message.includes('already registered')) {
            console.log('User exists. Updating password...');

            // We first need to find the user's ID
            // Note: listUsers isn't always efficient but fine for a script
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

            if (listError) {
                console.error('Failed to list users:', listError);
                return;
            }

            const user = users.find(u => u.email === email);

            if (user) {
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    user.id,
                    {
                        password: password,
                        user_metadata: { full_name: fullName, role: 'admin' }
                    }
                );

                if (updateError) {
                    console.error('Failed to update user:', updateError);
                } else {
                    console.log('✅ User updated successfully.');
                }
            } else {
                console.error('User said to exist but not found in list.');
            }
        }
    } else {
        console.log('✅ User created successfully:', data.user.id);
    }
};

createAdmin();
