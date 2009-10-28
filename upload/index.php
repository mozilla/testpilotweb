<?php

# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Test Pilot Server
#
# The Initial Developer of the Original Code is
# Mozilla Labs.
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#	Toby Elliott (telliott@mozilla.com)
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

	define('TEST_PILOT_PATH', '/var/www/testpilot/storage');

	$testid = ini_get('magic_quotes_gpc') ? stripslashes($_POST['testid']) : $_POST['testid'];
	$data = ini_get('magic_quotes_gpc') ? stripslashes($_POST['data']) : $_POST['data'];
	
	if (!$data)
		exit("3");
		
	if (!$testid || !file_exists(TEST_PILOT_PATH . '/' . $testid))
		exit("2");

	$filename = time() . '.';
	for ($i = 1; $i <= 4; $i++) 
	{
   		$number = rand(0,35) + 48;
   		if ($number > 57) { $number += 7; }
   		$filename .= chr($number);
	}


	$fh = fopen(TEST_PILOT_PATH . '/' . $testid . '/' . $filename, 'w');
	if (!$fh)
		exit("4");

	fwrite($fh, $data);
	fclose($fh);
	exit("1");
	
?>
