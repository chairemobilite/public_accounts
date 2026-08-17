import { role } from "better-auth/plugins";
import { auth } from "../utils/auth.js";
import { db } from "../db/db.js";
import { sql } from "kysely";
// Database connection

async function createUser() {
    // Parse arguments: node createUser.ts --email="test@example.com" --password="securePass"
    const args = process.argv.slice(2);
    const emailArg = args.find(a => a.startsWith('--email='));
    const passArg = args.find(a => a.startsWith('--password='));
    const nameArg = args.find(a => a.startsWith('--name='));
    const userNameArg = args.find(a=>a.startsWith('--username='));
    const roleArg = args.find(a=>a.startsWith('--role='));
    const skipExistingArg = args.find(a=>a.startsWith('--skip-existing='))
    if (!emailArg || !passArg||!nameArg||!userNameArg||!roleArg) {
        console.error("Usage: npm run createUser.ts --email=user@test.com --password=securePass --name='John Doe' --username='Big Horn Tx' --role=[admin|user]");
        process.exit(1);
    }

    const email = emailArg.split('=')[1];
    const password = passArg.split('=')[1];
    const name = nameArg.split('=')[1];
    const role = roleArg.split('=')[1];
    const username = userNameArg.split('=')[1];
    const skipExistingVal=skipExistingArg?.split('=')[1]
    const skipExisting = skipExistingVal === 'true'?true:false;
    console.log("🔐 Creating user via CLI arguments...");
    try {
        if (email&&password&&name&&username&&role&&(role==='admin'||role==='user')){
            const existingUserQuery =  sql`select * from "public"."user" where "public"."user"."email"=${email} OR "public"."user"."username" = ${username.toLowerCase()}`
            const {rows:results}= await existingUserQuery.execute(db)
            // if there no users with the specified username or email , we create the new user
            if (results.length===0){
                const res = await auth.api.createUser({
                    body: {
                        email: email,
                        password: password,
                        name: name,
                        role:role,
                        data:{
                            username:username
                        }
                    }
                });
                console.log("✅ Success:", res);
                // if the user or email exists and we aren't explicitely told to skip it, we throw an error
            }else if (!skipExistingArg||(skipExistingArg&&skipExisting===false)){
                throw new Error(`Username ${username} or email ${email} is already used. Please provide unique username or email`)
                // otherwise we just log that there's a conflict and go on our way
            }else{
                console.log(`Username ${username} or email ${email} is already used. Skipping user creation.`)
            }
            
        }else{
            throw new Error("Didn't provide required inputs: Usage: npm run createUsert.ts --email=user@test.com --password=securePass --name='John Doe' --username='Big Horn Tx' --role=[admin|user]")
        }
        
    } catch (error) {
        console.error("❌ Failed:", error);
        process.exit(1);
    } 
}

createUser().catch((err) => {
    console.error(err);
    process.exit(1);
});