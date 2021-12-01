import configs from './config.json'
import fetch from "node-fetch";
import { Client, Intents, MessageActionRow, MessageButton } from "discord.js";
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const version = "2021.12.1 BETA";

client.on("ready", () => {
    /*
    If version is in beta, it's in DND with "Playing with beta features!" as its status. Otherwise, it's only online.
    */
    if (version.includes("BETA")) {
        client.user.setPresence({activities: [{name: "with beta features!"}], status: "dnd"});
        console.log("-----> WARNING: This is a beta version. Presence set to Do Not Disturb.");
    } else {
        client.user.setPresence({status: "online"});
    }

    console.log(`-----> ${client.user.username} is online.`);
});

client.on("interactionCreate", (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName == "record")
        {
            const data = {
                "user_id": interaction.user.id,
                "weight": parseFloat(interaction.options.data[0].value)
            }
        
            fetch("https://ruby-weight-management.herokuapp.com/update-weight/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.status.toString().includes("ERROR"))
                {
                    interaction.reply({content: JSON.stringify(data), ephemeral: true})
                    
                } else {
                    if (data.status.toString().includes("not in the database"))
                    {
                        const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('new_user')
                                .setLabel('Begin Journey')
                                .setStyle('SUCCESS')
                        );

                        interaction.reply({content: "You are not in the database. Would you like to add yourself? :eyes:", components: [row], ephemeral: true})
                    } else {
                        interaction.reply(data.status.toString())
                    }
                    
                }
            })
        }
        else if (interaction.commandName == "progress")
        {
            fetch(`https://ruby-weight-management.herokuapp.com/weight-${interaction.user.id}/`)
            .then(response => response.json())
            .then(data => {
                /*
                    This is where the plotting should happen!
                */
                    var trace1 = {
                        x: [1, 2, 3, 4],
                        y: [10, 15, 13, 17],
                        mode: 'markers',
                        name: 'Scatter'
                      };
                      
                      var trace2 = {
                        x: [2, 3, 4, 5],
                        y: [16, 5, 11, 9],
                        mode: 'lines',
                        name: 'Lines'
                      };
                      
                      var trace3 = {
                        x: [1, 2, 3, 4],
                        y: [12, 9, 15, 12],
                        mode: 'lines+markers',
                        name: 'Scatter + Lines'
                      };
                      
                      var data = [ trace1, trace2, trace3 ];
                      
                      var layout = {
                        title:'Adding Names to Line and Scatter Plot'
                      };
                      
                      Plotly.newPlot('myDiv', data, layout);

                console.log(data)
                interaction.reply({content: JSON.stringify(data), ephemeral: true});
            });
            
        }
    }
    else if (interaction.isButton())
    {
        if (interaction.customId == "new_user")
        {
            const data = {
                "user_id": interaction.user.id,
            }
        
            fetch("https://ruby-weight-management.herokuapp.com/new-user/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.status.toString().includes("ERROR")) {
                    interaction.reply({content: "You're in! :partying_face: Hit up `/record` to start graphing!", ephemeral: true})
                } else {
                    interaction.reply("An error occured. :(")
                    console.log(data.status)
                }
                
            });
        }
    }
});

client.login(configs.BOT_TOKEN);

/*
node --experimental-json-modules Ruby.js
*/