// src/components/poll/multi-select-users.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, X, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { type UserProfile } from '@/services/firestore';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface UserMultiSelectProps {
  users: UserProfile[];
  selectedUsers: UserProfile[];
  onSelectedUsersChange: (users: UserProfile[]) => void;
  maxSelection?: number;
}

export function UserMultiSelect({ users, selectedUsers, onSelectedUsersChange, maxSelection }: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (user: UserProfile) => {
    const isSelected = selectedUsers.some((u) => u.uid === user.uid);
  
    if (isSelected) {
      onSelectedUsersChange(selectedUsers.filter((u) => u.uid !== user.uid));
    } else {
      if (maxSelection === 1) {
        onSelectedUsersChange([user]);
      } else if (maxSelection === undefined || selectedUsers.length < maxSelection) {
        onSelectedUsersChange([...selectedUsers, user]);
      }
    }
     // If it's a single selection, close the popover.
    if (maxSelection === 1) {
        setOpen(false);
    }
  };

  const handleUnselect = (uid: string) => {
    onSelectedUsersChange(selectedUsers.filter(u => u.uid !== uid));
  };
  
  const selectableUsers = users;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
          >
            <div className="flex flex-wrap gap-1 items-center">
              {selectedUsers.length > 0 ? (
                selectedUsers.map(user => (
                  <Badge
                    key={user.uid}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {user.name}
                    <button
                        type="button"
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => { if (e.key === "Enter") handleUnselect(user.uid); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={() => handleUnselect(user.uid)}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Select users...</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {selectableUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u.uid === user.uid);
                  // Disable if max is reached AND the current item is not already selected.
                  // But if maxSelection is 1, it should always be selectable to allow switching.
                  const isDisabled = 
                    maxSelection !== undefined &&
                    maxSelection > 1 &&
                    selectedUsers.length >= maxSelection && 
                    !isSelected;

                  return (
                    <CommandItem
                      key={user.uid}
                      onSelect={() => handleSelect(user)}
                      disabled={isDisabled}
                      className={cn(
                          "flex items-center justify-between", 
                          isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                         <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
